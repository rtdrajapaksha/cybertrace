"""
Span-level scoring for the PII detector.

A prediction counts as correct only if its start, end AND label all match a
gold span exactly (strict match). Reports precision, recall and F1 per label
plus a micro-average, as a table you can paste into the report.

Used by baseline.py and train.py. Can also score a predictions file:
  python3 evaluate.py data/test.jsonl predictions.jsonl
where predictions.jsonl has the same {"text", "spans"} shape as the data.
"""
import json
import sys
from collections import Counter


def load_jsonl(path):
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def span_set(spans):
    return {(s["start"], s["end"], s["label"]) for s in spans}


def score(gold_records, pred_records):
    tp, fp, fn = Counter(), Counter(), Counter()
    for gold, pred in zip(gold_records, pred_records):
        g, p = span_set(gold["spans"]), span_set(pred["spans"])
        for s in p & g:
            tp[s[2]] += 1
        for s in p - g:
            fp[s[2]] += 1
        for s in g - p:
            fn[s[2]] += 1

    labels = sorted(set(tp) | set(fp) | set(fn))
    rows = []
    for lab in labels + ["ALL (micro)"]:
        if lab == "ALL (micro)":
            t, f_p, f_n = sum(tp.values()), sum(fp.values()), sum(fn.values())
        else:
            t, f_p, f_n = tp[lab], fp[lab], fn[lab]
        precision = t / (t + f_p) if t + f_p else 0.0
        recall = t / (t + f_n) if t + f_n else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        rows.append({"label": lab, "precision": precision, "recall": recall, "f1": f1,
                     "support": t + f_n})
    return rows


def print_table(rows, title):
    print(f"\n{title}")
    print(f"| {'Label':<12} | Precision | Recall |   F1  | Support |")
    print(f"| {'-' * 12} | --------- | ------ | ----- | ------- |")
    for r in rows:
        print(f"| {r['label']:<12} | {r['precision']:9.3f} | {r['recall']:6.3f} | "
              f"{r['f1']:5.3f} | {r['support']:7d} |")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("usage: python3 evaluate.py GOLD.jsonl PRED.jsonl")
    print_table(score(load_jsonl(sys.argv[1]), load_jsonl(sys.argv[2])), "Results")
