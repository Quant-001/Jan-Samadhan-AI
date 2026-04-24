"""
Services for turning a YouTube transcript into structured study material.

Two backends are supported:
1. OpenAI (when OPENAI_API_KEY is set) — produces high-quality summaries,
   sections, glossary and quizzes via LLM.
2. Heuristic (default) — pure-Python NLP-style approach using sentence
   ranking, no external API calls. Always available.
"""

from __future__ import annotations

import json
import logging
import re
from collections import Counter
from typing import Tuple
from urllib.parse import parse_qs, urlparse

import requests
from django.conf import settings
from youtube_transcript_api import (
    YouTubeTranscriptApi,
    NoTranscriptFound,
    TranscriptsDisabled,
    VideoUnavailable,
)

logger = logging.getLogger(__name__)


class TranscriptError(Exception):
    """Raised when we cannot retrieve the transcript for a video."""


# --------------------------------------------------------------------------- #
# YouTube helpers
# --------------------------------------------------------------------------- #

_YOUTUBE_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")


def extract_video_id(url: str) -> str:
    """Pull the 11-character YouTube video id out of any common URL form."""
    if not url:
        raise ValueError("URL is required.")

    if _YOUTUBE_ID_RE.match(url):
        return url

    parsed = urlparse(url)
    host = (parsed.netloc or "").lower()

    if "youtu.be" in host:
        candidate = parsed.path.lstrip("/").split("/")[0]
        if _YOUTUBE_ID_RE.match(candidate):
            return candidate

    if "youtube.com" in host or "youtube-nocookie.com" in host:
        if parsed.path == "/watch":
            qs = parse_qs(parsed.query)
            v = qs.get("v", [None])[0]
            if v and _YOUTUBE_ID_RE.match(v):
                return v
        # /embed/<id>, /shorts/<id>, /v/<id>
        parts = [p for p in parsed.path.split("/") if p]
        if len(parts) >= 2 and parts[0] in {"embed", "shorts", "v", "live"}:
            candidate = parts[1]
            if _YOUTUBE_ID_RE.match(candidate):
                return candidate

    raise ValueError("Could not parse a YouTube video ID from that URL.")


def fetch_video_title(video_id: str) -> str | None:
    """Best-effort title fetch via YouTube's oEmbed endpoint (no API key)."""
    try:
        r = requests.get(
            "https://www.youtube.com/oembed",
            params={"url": f"https://www.youtube.com/watch?v={video_id}", "format": "json"},
            timeout=8,
        )
        if r.ok:
            return r.json().get("title")
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to fetch video title: %s", exc)
    return None


def fetch_transcript(video_id: str, preferred: str = "en") -> Tuple[str, str]:
    """Return (transcript_text, language_code) for the given YouTube video."""
    try:
        transcripts = YouTubeTranscriptApi.list_transcripts(video_id)
    except (TranscriptsDisabled, VideoUnavailable) as exc:
        raise TranscriptError(f"Transcript unavailable: {exc}") from exc
    except Exception as exc:  # noqa: BLE001
        raise TranscriptError(f"Could not list transcripts: {exc}") from exc

    transcript_obj = None
    try:
        transcript_obj = transcripts.find_transcript([preferred])
    except NoTranscriptFound:
        try:
            transcript_obj = transcripts.find_generated_transcript([preferred])
        except NoTranscriptFound:
            try:
                transcript_obj = next(iter(transcripts))
            except StopIteration as exc:
                raise TranscriptError("No transcripts available for this video.") from exc

    try:
        entries = transcript_obj.fetch()
    except Exception as exc:  # noqa: BLE001
        raise TranscriptError(f"Failed to fetch transcript: {exc}") from exc

    text = " ".join(e.get("text", "").strip() for e in entries if e.get("text"))
    text = re.sub(r"\s+", " ", text).strip()
    return text, getattr(transcript_obj, "language_code", preferred)


# --------------------------------------------------------------------------- #
# Heuristic structuring (no external services)
# --------------------------------------------------------------------------- #

_STOPWORDS = set(
    """a an and are as at be but by for from has have he her his i in is it its
    of on or our she that the their them they this to was we were will with you
    your about into over after before than then there here just like also more
    most some any all not only such because while through between against some
    very can could would should may might must do does did been being who whom
    which what when where why how if so up down out off above below when these
    those though although however moreover therefore thus actually basically
    really very kind sort lot lots stuff thing things really yeah okay ok uh um
    """.split()
)


def _sentence_split(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z\"'])", text.strip())
    return [p.strip() for p in parts if p.strip()]


def _tokenize(text: str) -> list[str]:
    return [w for w in re.findall(r"[A-Za-z][A-Za-z\-']{2,}", text.lower()) if w not in _STOPWORDS]


def _score_sentences(sentences: list[str]) -> list[tuple[float, int, str]]:
    """Return sentences as (score, original_index, sentence)."""
    word_freq: Counter[str] = Counter()
    for s in sentences:
        word_freq.update(_tokenize(s))
    if not word_freq:
        return [(0.0, i, s) for i, s in enumerate(sentences)]
    max_freq = max(word_freq.values())
    scored = []
    for i, s in enumerate(sentences):
        tokens = _tokenize(s)
        if not tokens:
            scored.append((0.0, i, s))
            continue
        score = sum(word_freq[w] / max_freq for w in tokens) / len(tokens)
        # mild length preference for medium sentences
        words = max(1, len(s.split()))
        if 8 <= words <= 35:
            score *= 1.1
        scored.append((score, i, s))
    return scored


def _top_sentences(sentences: list[str], n: int) -> list[str]:
    if not sentences:
        return []
    scored = _score_sentences(sentences)
    top = sorted(scored, key=lambda t: t[0], reverse=True)[:n]
    top_sorted = sorted(top, key=lambda t: t[1])
    return [s for _, _, s in top_sorted]


def _chunk_into_sections(sentences: list[str], num_sections: int) -> list[list[str]]:
    if not sentences:
        return []
    num_sections = max(1, min(num_sections, len(sentences)))
    chunk_size = max(1, len(sentences) // num_sections)
    chunks: list[list[str]] = []
    for i in range(0, len(sentences), chunk_size):
        chunks.append(sentences[i : i + chunk_size])
        if len(chunks) == num_sections:
            # absorb remaining into last chunk
            remainder = sentences[i + chunk_size :]
            if remainder:
                chunks[-1].extend(remainder)
            break
    return chunks


def _section_title(chunk: list[str], idx: int) -> str:
    text = " ".join(chunk)
    tokens = _tokenize(text)
    if not tokens:
        return f"Section {idx + 1}"
    common = [w for w, _ in Counter(tokens).most_common(3)]
    label = " ".join(w.capitalize() for w in common[:2]) or f"Topic {idx + 1}"
    return f"{idx + 1}. {label}"


def _glossary(text: str, limit: int = 8) -> list[dict]:
    # Capitalized multi-word phrases are often domain terms.
    candidates = re.findall(r"\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})\b", text)
    counts = Counter(c for c in candidates if len(c) > 3)
    glossary: list[dict] = []
    for term, _ in counts.most_common(limit * 3):
        if term.lower() in _STOPWORDS:
            continue
        # find a sentence containing the term to use as definition
        match = re.search(r"([^.!?]*\b" + re.escape(term) + r"\b[^.!?]*[.!?])", text)
        if match:
            definition = match.group(1).strip()
            glossary.append({"term": term, "definition": definition})
        if len(glossary) >= limit:
            break
    return glossary


def _build_quiz(sentences: list[str], top_terms: list[str], limit: int = 5) -> list[dict]:
    quiz: list[dict] = []
    used = set()
    for term in top_terms:
        if len(quiz) >= limit:
            break
        target = next(
            (s for s in sentences if term.lower() in s.lower() and s not in used and len(s.split()) >= 8),
            None,
        )
        if not target:
            continue
        used.add(target)
        blanked = re.sub(re.escape(term), "______", target, count=1, flags=re.IGNORECASE)
        distractors = [t for t in top_terms if t.lower() != term.lower()][:6]
        # build 3 distractors + 1 answer
        options = list(dict.fromkeys([term] + distractors))[:4]
        if len(options) < 4:
            continue
        # shuffle deterministically by sorting on length then alpha
        options_sorted = sorted(options, key=lambda x: (len(x), x.lower()))
        answer_index = options_sorted.index(term)
        quiz.append(
            {
                "question": f"Fill in the blank: {blanked}",
                "options": options_sorted,
                "answer_index": answer_index,
                "explanation": f"The original sentence used the term '{term}'.",
            }
        )
    return quiz


def heuristic_structure(transcript: str, title: str = "") -> dict:
    sentences = _sentence_split(transcript)
    if not sentences:
        return {
            "title": title or "Untitled",
            "summary": "",
            "sections": [],
            "key_points": [],
            "glossary": [],
            "quiz": [],
            "source": "heuristic",
        }

    # number of sections scales with content length
    num_sections = min(7, max(3, len(sentences) // 30))
    chunks = _chunk_into_sections(sentences, num_sections)

    sections = []
    for i, chunk in enumerate(chunks):
        section_text = " ".join(chunk)
        section_top = _top_sentences(chunk, n=min(3, len(chunk)))
        sections.append(
            {
                "title": _section_title(chunk, i),
                "content": section_text,
                "key_points": section_top,
            }
        )

    summary = " ".join(_top_sentences(sentences, n=min(6, len(sentences))))
    key_points = _top_sentences(sentences, n=min(8, len(sentences)))

    # term frequency for quiz / glossary
    tokens = _tokenize(transcript)
    top_terms_counter = Counter(tokens)
    top_terms = [w.capitalize() for w, _ in top_terms_counter.most_common(20)]
    glossary = _glossary(transcript)
    quiz = _build_quiz(sentences, top_terms, limit=5)

    return {
        "title": title or "Untitled",
        "summary": summary,
        "sections": sections,
        "key_points": key_points,
        "glossary": glossary,
        "quiz": quiz,
        "source": "heuristic",
    }


# --------------------------------------------------------------------------- #
# Optional OpenAI structuring
# --------------------------------------------------------------------------- #

_OPENAI_PROMPT = """You are an expert teacher converting a video transcript into
structured study material. Return STRICT JSON, no commentary, with this shape:

{
  "title": "...",
  "summary": "3-5 sentence overall summary",
  "sections": [
    {"title": "1. ...", "content": "1-2 paragraphs", "key_points": ["...", "..."]}
  ],
  "key_points": ["overall key point", "..."],
  "glossary": [{"term": "...", "definition": "..."}],
  "quiz": [
    {"question": "...", "options": ["...","...","...","..."],
     "answer_index": 0, "explanation": "..."}
  ]
}

Transcript title: {title}

Transcript:
{transcript}
"""


def openai_structure(transcript: str, title: str = "") -> dict | None:
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        return None
    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)
        # truncate very long transcripts to keep tokens reasonable
        truncated = transcript[:12000]
        prompt = _OPENAI_PROMPT.format(title=title or "Unknown", transcript=truncated)
        resp = client.chat.completions.create(
            model=settings.OPENAI_MODEL or "gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You output strict JSON only."},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        content = resp.choices[0].message.content or "{}"
        data = json.loads(content)
        data["source"] = "openai"
        return data
    except Exception as exc:  # noqa: BLE001
        logger.warning("OpenAI structuring failed, falling back to heuristic: %s", exc)
        return None


def structure_material(transcript: str, title: str = "") -> dict:
    data = openai_structure(transcript, title=title)
    if data:
        return data
    return heuristic_structure(transcript, title=title)
