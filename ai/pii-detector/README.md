# PII detector (CyberTrace AI module)

Finds personal information in public profile text, such as a bio found by a
username scan, and labels each item: `NAME`, `EMAIL`, `PHONE`, `DOB`,
`ADDRESS`, `EMPLOYER`, `SCHOOL`, `LOCATION`. Each item found can become a
`scan_results` row, which the existing rule-based scoring then scores.

> **Scope note.** The Capstone proposal listed ML models as out of scope.
> The lecturer has since approved this module as in scope (confirmed by the
> project owner, Nov 2026). Record it as a scope change in the final report.

## Status (18 Nov 2026)

| Step | File | Status |
| --- | --- | --- |
| Synthetic labelled data | `generate_data.py` | Done, runs with plain Python 3.9+ |
| Scoring (strict span P/R/F1) | `evaluate.py` | Done |
| Regex baseline | `baseline.py` | Done, results below |
| DistilBERT fine-tuning | `train.py` | Written, **not run yet** (needs a GPU or Colab) |
| Serving to the backend (FastAPI or ONNX) | — | Not started |

## Quick start

```bash
cd ai/pii-detector
python3 generate_data.py      # writes data/train.jsonl, val.jsonl, test.jsonl
python3 baseline.py           # regex baseline on the test set
```

Training (Google Colab with a GPU is easiest: upload this folder, then run):

```bash
pip install -r requirements.txt
python3 generate_data.py
python3 train.py              # add --epochs 1 --limit 300 for a quick CPU smoke test
```

`train.py` prints the same results table as the baseline, so the two can go
side by side in the report.

## How the data is built

- 3,000 fake bios from sentence templates, filled with invented names,
  emails, Australian-format phone numbers, dates, addresses, employers,
  schools and cities. About 1 in 7 bios contains no personal info at all.
- Split 80 / 10 / 10 into train / val / test.
- **Fair test set:** the test split uses (1) sentence templates never seen in
  training and (2) names, employers, schools, streets and cities held back
  from training (the last 3 of each list). Train/test overlap for NAME,
  EMPLOYER, SCHOOL and LOCATION is 0.

## Baseline results (regex only, test set, 300 bios, 374 items)

| Label | Precision | Recall | F1 |
| --- | --- | --- | --- |
| EMAIL, PHONE, DOB, ADDRESS | 1.000 | 1.000 | 1.000 |
| NAME, EMPLOYER, SCHOOL, LOCATION | 0.000 | 0.000 | 0.000 |
| **All (micro)** | 1.000 | 0.422 | **0.594** |

Regexes handle fixed formats and miss free-form details entirely. The
trained model has to beat **F1 0.594** overall, mainly by finding names,
employers, schools and places.

## Limitations to state in the report

- The data is synthetic. Fixed formats match the regexes exactly, so the
  baseline's 1.000 on emails and phones is optimistic. Real bios are messier
  (emoji, slang, "call me on oh-four...", typos).
- Next improvement: hand-label a small set of realistic, made-up bios as a
  second test set, without using real people's data.
- **Ethics:** don't collect real people's profiles to train on. That is
  personal data and would need university ethics approval.

## Files

- `generate_data.py`: builds the dataset
- `evaluate.py`: strict span scoring, shared by baseline and model
- `baseline.py`: regex detector
- `train.py`: DistilBERT token classifier (BIO tags), saves to `models/`
- `requirements.txt`: only needed for training
- `data/`, `models/`: generated, not committed (see `.gitignore`)
