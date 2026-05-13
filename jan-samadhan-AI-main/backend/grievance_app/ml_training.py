import json
from collections import Counter, defaultdict
from pathlib import Path

from .ai_service import CATEGORIES, clean_text


TRAINING_EXAMPLES = [
    ("Power cut in my area since last night and transformer is making noise", "ELECTRICITY"),
    ("Electric pole wire has fallen on road and it is dangerous", "ELECTRICITY"),
    ("Street light is not working near my house", "ELECTRICITY"),
    ("Bijli supply band hai aur meter spark kar raha hai", "ELECTRICITY"),
    ("No water supply in my ward for three days", "WATER"),
    ("Water pipeline is leaking and road is full of water", "WATER"),
    ("Drinking water is dirty and smells bad", "WATER"),
    ("Paani ki pipe toot gayi hai", "WATER"),
    ("Garbage has not been collected for one week", "SANITATION"),
    ("Drain is blocked and sewage is overflowing", "SANITATION"),
    ("Public toilet is dirty and there is bad smell", "SANITATION"),
    ("Kooda sadak par pada hai safai nahi hui", "SANITATION"),
    ("Large pothole on main road caused an accident", "ROADS"),
    ("Road is broken and needs urgent repair", "ROADS"),
    ("Footpath is damaged near school", "ROADS"),
    ("Traffic signal is not working", "ROADS"),
    ("Ration card application is delayed", "PUBLIC_SERVICES"),
    ("Pension has not been credited for two months", "PUBLIC_SERVICES"),
    ("Aadhar correction request is pending", "PUBLIC_SERVICES"),
    ("Birth certificate office is not processing application", "PUBLIC_SERVICES"),
    ("Government hospital has no medicine available", "HEALTH"),
    ("Ambulance did not arrive during emergency", "HEALTH"),
    ("Clinic doctor is absent every day", "HEALTH"),
    ("Vaccination center is closed", "HEALTH"),
    ("School has no teacher for mathematics", "EDUCATION"),
    ("Scholarship payment is delayed", "EDUCATION"),
    ("Midday meal quality is poor", "EDUCATION"),
    ("College fee refund is pending", "EDUCATION"),
    ("General request for information about local office", "OTHER"),
    ("I want to submit a suggestion for public improvement", "OTHER"),
]


def build_training_dataset(feedback_records=None):
    dataset = list(TRAINING_EXAMPLES)
    for record in feedback_records or []:
        text = " ".join(
            str(record.get(field) or "")
            for field in ["title", "description", "translated_description"]
        ).strip()
        category = record.get("final_category") or record.get("category")
        if text and category in CATEGORIES:
            dataset.append((text, category))
    return dataset


def train_naive_bayes_model(dataset):
    category_docs = defaultdict(int)
    category_tokens = defaultdict(Counter)
    vocabulary = set()

    for text, category in dataset:
        cleaned = clean_text(text)
        tokens = cleaned.split()
        if not tokens or category not in CATEGORIES:
            continue
        category_docs[category] += 1
        category_tokens[category].update(tokens)
        vocabulary.update(tokens)

    categories = {}
    for category in CATEGORIES:
        token_counts = category_tokens[category]
        categories[category] = {
            "doc_count": category_docs[category],
            "token_total": sum(token_counts.values()),
            "token_counts": dict(token_counts),
        }

    return {
        "model_type": "multinomial_naive_bayes",
        "version": 1,
        "total_docs": sum(category_docs.values()),
        "vocabulary_size": len(vocabulary),
        "categories": categories,
    }


def save_model(model, output_path):
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(model, indent=2, ensure_ascii=False), encoding="utf-8")
    return output_path
