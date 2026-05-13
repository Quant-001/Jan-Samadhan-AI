"""
AI Classification Service.

Pipeline:
Complaint text -> language detection -> translation -> cleaning/NLP processing
-> local supervised ML -> optional pretrained transformer -> keyword fallback
-> priority detection.
"""
import json
import logging
import math
import re
from pathlib import Path
from django.conf import settings

logger = logging.getLogger(__name__)

BASE_DIR = Path(settings.BASE_DIR)
MODEL_DIR = BASE_DIR / "ai_models"
SUPERVISED_MODEL_PATH = MODEL_DIR / "grievance_classifier.json"
TRANSFORMER_MODEL_PATH = MODEL_DIR / "bert_grievance_classifier"

CATEGORIES = [
    "ELECTRICITY", "WATER", "SANITATION", "ROADS",
    "PUBLIC_SERVICES", "HEALTH", "EDUCATION", "OTHER"
]

KEYWORDS = {
    "ELECTRICITY": ["light", "power", "electricity", "bijli", "current", "transformer",
                    "wire", "pole", "voltage", "outage", "blackout", "electric", "meter"],
    "WATER": ["water", "paani", "pipe", "leak", "supply", "drain", "bore", "tap",
              "sewage", "borewell", "drinking water", "nala"],
    "SANITATION": ["garbage", "waste", "dustbin", "clean", "safai", "toilet",
                   "hygiene", "drain", "sewage", "smell", "filth", "kooda"],
    "ROADS": ["road", "pothole", "street", "footpath", "bridge", "signal", "traffic",
              "divider", "construction", "repair", "sadak", "gutter"],
    "HEALTH": ["hospital", "doctor", "medicine", "clinic", "health", "ambulance",
               "disease", "dispensary", "vaccination", "illness"],
    "EDUCATION": ["school", "teacher", "college", "book", "fee", "scholarship",
                  "midday meal", "shiksha", "vidyalaya"],
    "PUBLIC_SERVICES": ["ration", "certificate", "id card", "aadhar", "pension",
                        "subsidy", "government office", "application", "passbook"],
}

PRIORITY_KEYWORDS = {
    "CRITICAL": ["death", "fire", "flood", "emergency", "accident", "collapse",
                 "electrocution", "drowning", "serious", "critical", "urgent", "aag", "maut"],
    "HIGH": ["no water", "no electricity", "broken", "dangerous", "injury",
             "hospital", "school closed", "days", "week"],
    "MEDIUM": ["irregular", "complaint", "issue", "problem", "not working", "delay"],
}

STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has",
    "have", "in", "is", "it", "of", "on", "or", "our", "the", "there", "this",
    "to", "was", "were", "with",
}


def detect_language(text: str) -> str:
    try:
        from langdetect import detect
        return detect(text)
    except Exception:
        return "en"


def translate_to_english(text: str, source_lang: str) -> str:
    """Basic translation — in production replace with IndicTrans or DeepL free."""
    if source_lang == "en":
        return text
    try:
        import requests
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={source_lang}&tl=en&dt=t&q={requests.utils.quote(text)}"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            result = resp.json()
            return "".join([s[0] for s in result[0] if s[0]])
    except Exception as e:
        logger.warning(f"Translation failed: {e}")
    return text


def clean_text(text: str) -> str:
    """Normalize complaint text before ML/NLP classification."""
    text = (text or "").lower()
    text = re.sub(r"http\S+|www\.\S+", " ", text)
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    tokens = [token for token in text.split() if token not in STOP_WORDS]
    return " ".join(tokens)


def detect_priority(text: str) -> str:
    """Detect urgency using transparent priority keywords."""
    text_lower = text.lower()
    for level, words in PRIORITY_KEYWORDS.items():
        if any(word in text_lower for word in words):
            return level
    return "LOW"


def classify_with_supervised_model(cleaned_text: str) -> dict:
    """
    Local supervised Multinomial Naive Bayes-style classifier.

    Expected file: backend/ai_models/grievance_classifier.json
    The model is trained by the train_local_ai_model management command. It is
    stored as JSON so Docker can run the classifier without paid APIs or large
    dependencies.
    """
    if not SUPERVISED_MODEL_PATH.exists():
        return None
    try:
        model = json.loads(SUPERVISED_MODEL_PATH.read_text(encoding="utf-8"))
        tokens = cleaned_text.split()
        vocabulary_size = max(int(model.get("vocabulary_size", 1)), 1)
        total_docs = max(int(model.get("total_docs", 1)), 1)
        scores = {}

        for category, data in model.get("categories", {}).items():
            doc_count = max(int(data.get("doc_count", 0)), 0)
            token_total = max(int(data.get("token_total", 0)), 0)
            token_counts = data.get("token_counts", {})
            score = math.log((doc_count + 1) / (total_docs + len(CATEGORIES)))
            for token in tokens:
                score += math.log(
                    (int(token_counts.get(token, 0)) + 1) / (token_total + vocabulary_size)
                )
            scores[category] = score

        if not scores:
            return None

        category = max(scores, key=scores.get)
        sorted_scores = sorted(scores.values(), reverse=True)
        margin = sorted_scores[0] - sorted_scores[1] if len(sorted_scores) > 1 else 1.0
        confidence = min(0.98, max(0.55, 0.55 + margin / 8))
        return {
            "category": category,
            "priority": detect_priority(cleaned_text),
            "confidence": round(confidence, 2),
            "summary": cleaned_text[:120],
            "source": "local_naive_bayes",
        }
    except Exception as e:
        logger.warning(f"Supervised ML classification failed: {e}")
        return None


def classify_with_transformer(text: str) -> dict:
    """
    Optional pretrained language model classifier.

    Expected folder: backend/ai_models/bert_grievance_classifier/
    This can contain a fine-tuned BERT/DistilBERT/IndicBERT text-classification
    model. If transformers/torch or the model folder is missing, the app
    continues to the next classifier.
    """
    if not TRANSFORMER_MODEL_PATH.exists():
        return None
    try:
        from transformers import pipeline
        classifier = pipeline(
            "text-classification",
            model=str(TRANSFORMER_MODEL_PATH),
            tokenizer=str(TRANSFORMER_MODEL_PATH),
        )
        prediction = classifier(text[:512])[0]
        category = prediction.get("label", "OTHER").upper()
        if category not in CATEGORIES:
            category = "OTHER"
        return {
            "category": category,
            "priority": detect_priority(text),
            "confidence": round(float(prediction.get("score", 0.0)), 2),
            "summary": text[:120],
            "source": "pretrained_transformer",
        }
    except Exception as e:
        logger.warning(f"Transformer classification failed: {e}")
        return None


def classify_with_keywords(text: str) -> dict:
    """Fallback keyword-based classifier."""
    text_lower = text.lower()
    scores = {cat: 0 for cat in CATEGORIES}
    for cat, words in KEYWORDS.items():
        for word in words:
            if word in text_lower:
                scores[cat] += 1
    best_cat = max(scores, key=scores.get)
    if scores[best_cat] == 0:
        best_cat = "OTHER"
    confidence = min(0.5 + scores[best_cat] * 0.1, 0.85)

    return {
        "category": best_cat,
        "priority": detect_priority(text_lower),
        "confidence": round(confidence, 2),
        "summary": text[:100],
        "source": "keyword",
    }


def classify_complaint(text: str) -> dict:
    """
    Main AI/ML entry point.
    Returns: {category, priority, confidence, summary, source, original_lang,
    translated_text, cleaned_text}
    """
    lang = detect_language(text)
    translated = translate_to_english(text, lang) if lang != "en" else text
    cleaned = clean_text(translated)

    result = (
        classify_with_supervised_model(cleaned)
        or classify_with_transformer(translated)
        or classify_with_keywords(translated)
    )
    result["original_lang"] = lang
    result["translated_text"] = translated
    result["cleaned_text"] = cleaned
    return result


def citizen_help_chat(message: str) -> dict:
    """Answer citizen portal questions with a local helper."""
    question = (message or "").strip()
    if not question:
        return {
            "reply": "Please type your question about submitting, tracking, or updating a complaint.",
            "source": "local",
        }

    return {
        "reply": _local_citizen_help(question),
        "source": "local",
    }


def _local_citizen_help(message: str) -> str:
    text = message.lower()
    if any(word in text for word in ["submit", "complaint", "file", "register grievance"]):
        return (
            "To submit a complaint, sign in or create a citizen account, then choose "
            "Submit Complaint. Add a clear title, full description, location, and an optional photo or PDF."
        )
    if any(word in text for word in ["login", "sign in", "signup", "sign up", "register", "account"]):
        return (
            "Use Register to create a citizen account with your name, phone, email, username, and password. "
            "After login, the portal opens your citizen dashboard."
        )
    if any(word in text for word in ["track", "ticket", "status"]):
        return (
            "Use Track Complaint and enter your ticket ID, for example JS1234ABCD. "
            "You can track basic status without login, and see full details after signing in."
        )
    if any(word in text for word in ["document", "photo", "attachment", "proof", "pdf"]):
        return (
            "Attachments are optional, but a clear photo or PDF helps officers verify the issue faster. "
            "Avoid sharing sensitive personal documents unless the department needs them."
        )
    if any(word in text for word in ["department", "category", "ai", "classify"]):
        return (
            "The portal uses AI to classify your complaint and route it to the likely department. "
            "An admin can correct the department later if needed."
        )
    if any(word in text for word in ["urgent", "emergency", "danger", "critical", "fire", "accident"]):
        return (
            "For life-threatening emergencies, contact local emergency services first. "
            "You can still submit the complaint with clear urgent details afterward."
        )
    return (
        "I can help with submitting complaints, login/signup, tracking ticket status, attachments, "
        "and how AI routing works. What would you like to do?"
    )
