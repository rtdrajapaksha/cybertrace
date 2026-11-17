"""
Synthetic training data for the CyberTrace personal-info (PII) detector.

Writes fake public-profile bios with every personal detail labelled by
character span. Everything is invented: no real person's data is used.

Output (JSON Lines), one record per line:
  {"text": "...", "spans": [{"start": 10, "end": 22, "label": "PHONE"}, ...]}

Usage:
  python3 generate_data.py                 # 3000 records, seed 7, into data/
  python3 generate_data.py --n 10000 --seed 1
"""
import argparse
import json
import os
import random

LABELS = ["NAME", "EMAIL", "PHONE", "DOB", "ADDRESS", "EMPLOYER", "SCHOOL", "LOCATION"]

FIRST = ["Ava", "Liam", "Noah", "Mia", "Zara", "Kavin", "Amaya", "Ethan", "Chloe", "Ravi",
         "Isla", "Arjun", "Sofia", "Lucas", "Nethmi", "Oliver", "Priya", "Jack", "Hana", "Leo"]
LAST = ["Perera", "Smith", "Nguyen", "Fernando", "Brown", "Silva", "Patel", "Wilson",
        "Jayasuriya", "Taylor", "Chen", "Martin", "Kumar", "Walker", "Dias", "Lee"]
STREETS = ["Main St", "Station Rd", "King St", "Park Ave", "Church St", "High St",
           "Victoria Pde", "Elm Ct", "Hill Rd", "Bay St"]
SUBURBS = ["Footscray", "Carlton", "Parramatta", "Fitzroy", "Sunshine", "Box Hill",
           "Newtown", "Glenelg", "Bondi", "Werribee"]
CITIES = ["Melbourne", "Sydney", "Brisbane", "Adelaide", "Perth", "Colombo", "Kandy",
          "Auckland", "Hobart", "Geelong"]
EMPLOYERS = ["Acme Analytics", "BlueRiver Bank", "Northwind Logistics", "Pixel Forge",
             "GreenLeaf Health", "Orbit Telecom", "Summit Retail", "Kestrel Labs"]
SCHOOLS = ["Victoria University", "Westbrook High School", "Lakeside College",
           "City Institute of Technology", "Riverside Grammar", "Eastfield TAFE"]
DOMAINS = ["example.com", "mail.example", "inbox.test", "webmail.example.org"]
MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August",
          "September", "October", "November", "December"]
FILLER = ["coffee addict", "gamer", "runner", "dog person", "photographer", "foodie",
          "cyclist", "bookworm", "traveller", "music lover", "coder", "gym regular"]


# The last 3 of each list are kept for the test set only, so a good test
# score can't come from memorising specific names, companies or places.
HOLD = 3


def pool(values, test):
    return values[-HOLD:] if test else values[:-HOLD]


def fake_value(label, rng, first, last, test=False):
    if label == "NAME":
        return f"{first} {last}"
    if label == "EMAIL":
        sep = rng.choice([".", "_", ""])
        num = rng.choice(["", str(rng.randint(1, 99))])
        return f"{first.lower()}{sep}{last.lower()}{num}@{rng.choice(DOMAINS)}"
    if label == "PHONE":
        style = rng.randint(0, 2)
        d = [rng.randint(0, 9) for _ in range(8)]
        if style == 0:
            return f"04{d[0]}{d[1]} {d[2]}{d[3]}{d[4]} {d[5]}{d[6]}{d[7]}"
        if style == 1:
            return f"+61 4{d[0]}{d[1]} {d[2]}{d[3]}{d[4]} {d[5]}{d[6]}{d[7]}"
        return f"(03) {d[0]}{d[1]}{d[2]}{d[3]} {d[4]}{d[5]}{d[6]}{d[7]}"
    if label == "DOB":
        day, month, year = rng.randint(1, 28), rng.randint(1, 12), rng.randint(1975, 2008)
        style = rng.randint(0, 2)
        if style == 0:
            return f"{day:02d}/{month:02d}/{year}"
        if style == 1:
            return f"{day} {MONTHS[month - 1]} {year}"
        return f"{year}-{month:02d}-{day:02d}"
    if label == "ADDRESS":
        return f"{rng.randint(1, 250)} {rng.choice(pool(STREETS, test))}, {rng.choice(pool(SUBURBS, test))}"
    if label == "EMPLOYER":
        return rng.choice(pool(EMPLOYERS, test))
    if label == "SCHOOL":
        return rng.choice(pool(SCHOOLS, test))
    if label == "LOCATION":
        return rng.choice(pool(CITIES, test))
    raise ValueError(label)


# Each template is a list of text pieces; {LABEL} marks a slot to fill.
TEMPLATES = [
    "Hi, I'm {NAME}! {FILLER} based in {LOCATION}.",
    "{NAME} | {FILLER} | works at {EMPLOYER}",
    "Studying at {SCHOOL}. DM me or email {EMAIL}",
    "Born {DOB}. Living in {LOCATION}, {FILLER}.",
    "Contact: {PHONE} or {EMAIL}",
    "Proud member of the {EMPLOYER} team. {FILLER}.",
    "Parcel? Send it to {ADDRESS}. Call {PHONE} if lost.",
    "{FILLER} from {LOCATION}. Class of {SCHOOL}.",
    "Birthday {DOB} \U0001F382 hit me up at {PHONE}",
    "New job at {EMPLOYER}! Old school: {SCHOOL}.",
    "{NAME}, {FILLER}. Moving to {ADDRESS} next month.",
    "Business enquiries: {EMAIL}",
    "Just a {FILLER} who likes long walks.",          # no PII: teaches the model to stay quiet
    "Posting about tech, games and coffee.",          # no PII
]


# Test set uses DIFFERENT sentence patterns, never seen in training, so the
# score shows whether the model generalises instead of memorising templates.
TEST_TEMPLATES = [
    "yo it's {NAME} — {FILLER}, currently at {EMPLOYER}",
    "Reach me on {PHONE} (texts only)",
    "Grad of {SCHOOL}, now in {LOCATION}",
    "{DOB} is my bday, don't forget",
    "Mail: {EMAIL} / Home: {ADDRESS}",
    "{FILLER} and proud {SCHOOL} alum",
    "Nothing to see here, just a {FILLER}.",
]


def build_record(template, rng, test=False):
    first, last = rng.choice(pool(FIRST, test)), rng.choice(pool(LAST, test))
    text, spans, i = "", [], 0
    while i < len(template):
        if template[i] == "{":
            j = template.index("}", i)
            slot = template[i + 1:j]
            if slot == "FILLER":
                text += rng.choice(FILLER)
            else:
                value = fake_value(slot, rng, first, last, test)
                spans.append({"start": len(text), "end": len(text) + len(value), "label": slot})
                text += value
            i = j + 1
        else:
            text += template[i]
            i += 1
    return {"text": text, "spans": spans}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=3000)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "data"))
    args = ap.parse_args()

    rng = random.Random(args.seed)

    # 80 / 10 / 10 split. Train and val share TEMPLATES; test uses TEST_TEMPLATES.
    n_train, n_val = int(args.n * 0.8), int(args.n * 0.1)
    n_test = args.n - n_train - n_val
    seen = [build_record(rng.choice(TEMPLATES), rng) for _ in range(n_train + n_val)]
    splits = {
        "train": seen[:n_train],
        "val": seen[n_train:],
        "test": [build_record(rng.choice(TEST_TEMPLATES), rng, test=True) for _ in range(n_test)],
    }
    os.makedirs(args.out, exist_ok=True)
    for name, rows in splits.items():
        with open(os.path.join(args.out, f"{name}.jsonl"), "w", encoding="utf-8") as f:
            for r in rows:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
        print(f"{name}: {len(rows)} records")


if __name__ == "__main__":
    main()
