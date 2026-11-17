"""
Fine-tune DistilBERT to find personal info in profile text (token
classification with BIO tags), then score it on the held-out test set with
the same strict span scorer as baseline.py.

Run on Google Colab (free GPU) or any machine with Python 3.9+:
  pip install -r requirements.txt
  python3 generate_data.py
  python3 train.py                       # ~5-10 min on a Colab T4 GPU
  python3 train.py --epochs 1 --limit 300   # quick smoke test on a laptop CPU

Saves the model to models/pii-distilbert/ (git-ignored: too big for git).
"""
import argparse
import os

import numpy as np
import torch
from transformers import (
    AutoModelForTokenClassification,
    AutoTokenizer,
    DataCollatorForTokenClassification,
    Trainer,
    TrainingArguments,
)

from evaluate import load_jsonl, print_table, score
from generate_data import LABELS

HERE = os.path.dirname(os.path.abspath(__file__))
TAGS = ["O"] + [f"{p}-{lab}" for lab in LABELS for p in ("B", "I")]
TAG2ID = {t: i for i, t in enumerate(TAGS)}
ID2TAG = {i: t for t, i in TAG2ID.items()}


class SpanDataset(torch.utils.data.Dataset):
    """Turns {"text", "spans"} records into token ids + one BIO tag per token."""

    def __init__(self, records, tokenizer, max_len=128):
        self.items = []
        for r in records:
            enc = tokenizer(r["text"], truncation=True, max_length=max_len,
                            return_offsets_mapping=True)
            labels = []
            for start, end in enc["offset_mapping"]:
                if start == end:            # special tokens like [CLS] / [SEP]
                    labels.append(-100)     # -100 = ignored by the loss
                    continue
                tag = "O"
                for s in r["spans"]:
                    if start >= s["start"] and end <= s["end"]:
                        tag = ("B-" if start == s["start"] else "I-") + s["label"]
                        break
                labels.append(TAG2ID[tag])
            enc.pop("offset_mapping")
            enc["labels"] = labels
            self.items.append(enc)

    def __len__(self):
        return len(self.items)

    def __getitem__(self, i):
        return self.items[i]


def predict_spans(text, model, tokenizer, device):
    """Runs the model on one text and joins B-/I- tokens back into character spans."""
    enc = tokenizer(text, return_offsets_mapping=True, truncation=True,
                    max_length=128, return_tensors="pt")
    offsets = enc.pop("offset_mapping")[0].tolist()
    with torch.no_grad():
        logits = model(**{k: v.to(device) for k, v in enc.items()}).logits[0]
    tags = [ID2TAG[i] for i in logits.argmax(-1).tolist()]

    spans, current = [], None
    for (start, end), tag in zip(offsets, tags):
        if start == end:
            continue
        if tag.startswith("B-") or (tag.startswith("I-") and (not current or current["label"] != tag[2:])):
            if current:
                spans.append(current)
            current = {"start": start, "end": end, "label": tag[2:]}
        elif tag.startswith("I-") and current:
            current["end"] = end
        else:
            if current:
                spans.append(current)
            current = None
    if current:
        spans.append(current)
    return spans


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="distilbert-base-cased")
    ap.add_argument("--epochs", type=int, default=3)
    ap.add_argument("--limit", type=int, default=0, help="use only N training rows (smoke test)")
    ap.add_argument("--out", default=os.path.join(HERE, "models", "pii-distilbert"))
    args = ap.parse_args()

    data = os.path.join(HERE, "data")
    train_rows = load_jsonl(os.path.join(data, "train.jsonl"))
    if args.limit:
        train_rows = train_rows[:args.limit]
    val_rows = load_jsonl(os.path.join(data, "val.jsonl"))
    test_rows = load_jsonl(os.path.join(data, "test.jsonl"))

    tokenizer = AutoTokenizer.from_pretrained(args.model)
    model = AutoModelForTokenClassification.from_pretrained(
        args.model, num_labels=len(TAGS), id2label=ID2TAG, label2id=TAG2ID)

    trainer = Trainer(
        model=model,
        args=TrainingArguments(
            output_dir=os.path.join(HERE, "models", "checkpoints"),
            num_train_epochs=args.epochs,
            per_device_train_batch_size=16,
            learning_rate=5e-5,
            weight_decay=0.01,
            logging_steps=50,
            save_strategy="no",
            report_to=[],
            seed=7,
        ),
        train_dataset=SpanDataset(train_rows, tokenizer),
        eval_dataset=SpanDataset(val_rows, tokenizer),
        data_collator=DataCollatorForTokenClassification(tokenizer),
    )
    trainer.train()
    print("validation loss:", trainer.evaluate()["eval_loss"])

    model.save_pretrained(args.out)
    tokenizer.save_pretrained(args.out)
    print("saved model to", args.out)

    device = trainer.model.device
    model.eval()
    pred = [{"text": r["text"], "spans": predict_spans(r["text"], trainer.model, tokenizer, device)}
            for r in test_rows]
    print_table(score(test_rows, pred), f"DistilBERT on test ({len(test_rows)} records, unseen templates)")


if __name__ == "__main__":
    np.random.seed(7)
    main()
