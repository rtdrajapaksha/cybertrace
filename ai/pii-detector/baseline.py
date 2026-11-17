"""
Baseline PII detector: hand-written regular expressions, no training.

This is the number the trained model has to beat. Regexes are good at
fixed formats (email, phone, dates) and weak at free-form details (names,
employers, schools, places), which is exactly where a model should help.

Usage:
  python3 baseline.py                        # scores data/test.jsonl
  python3 baseline.py --split val
"""
import argparse
import os
import re

from evaluate import load_jsonl, print_table, score

PATTERNS = [
    ("EMAIL", r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"),
    ("PHONE", r"(?:\+61 ?4\d{2}|04\d{2}) ?\d{3} ?\d{3}|\(0\d\) ?\d{4} ?\d{4}"),
    ("DOB", r"\b\d{2}/\d{2}/(?:19|20)\d{2}\b|\b(?:19|20)\d{2}-\d{2}-\d{2}\b|"
            r"\b\d{1,2} (?:January|February|March|April|May|June|July|August|September|"
            r"October|November|December) (?:19|20)\d{2}\b"),
    ("ADDRESS", r"\b\d{1,4} [A-Z][a-z]+ (?:St|Rd|Ave|Pde|Ct)\b, [A-Z][a-z]+(?: [A-Z][a-z]+)?"),
]


def predict(text):
    spans, taken = [], []
    for label, pattern in PATTERNS:
        for m in re.finditer(pattern, text):
            if any(m.start() < e and s < m.end() for s, e in taken):
                continue  # earlier, more specific pattern already claimed this text
            spans.append({"start": m.start(), "end": m.end(), "label": label})
            taken.append((m.start(), m.end()))
    return sorted(spans, key=lambda s: s["start"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--split", default="test")
    ap.add_argument("--data", default=os.path.join(os.path.dirname(__file__), "data"))
    args = ap.parse_args()

    gold = load_jsonl(os.path.join(args.data, f"{args.split}.jsonl"))
    pred = [{"text": g["text"], "spans": predict(g["text"])} for g in gold]
    print_table(score(gold, pred), f"Regex baseline on {args.split} ({len(gold)} records)")


if __name__ == "__main__":
    main()
