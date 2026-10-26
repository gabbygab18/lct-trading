"""Add what the Omni flyer has and the Omni price list doesn't.

    python scripts/omni_flyer.py <omni-flyer.csv> <out-dir>

The flyer (OMNI FLYERS_JULY-2026, image-only) names some items with other
codes than the price list (LCF35E27 is the price list's LC4W candle bulb), adds
blister-pack SKUs (-PK) at their own price, and sells switch/outlet plate sets
that the price list doesn't. Reads omni-flyer.csv (page,section,code,name,
variant,srp,notes, transcribed from the flyer) and the local catalog, and
writes, for the item importer:

  <out>/omni_flyer_new.csv   items only in the flyer, at the flyer's SRP
  <out>/omni_flyer_revive.csv hidden sample items under a flyer code, brought
                             back with the flyer name and price
  <out>/omni_flyer_tags.csv  sku,tags: flyer codes added as search tags, so a
                             customer typing the flyer code finds the item
and prints what it left alone (same code, other price: the price list wins).
"""
import csv
import json
import re
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = Path(sys.argv[1]), Path(sys.argv[2])
k = lambda s: re.sub(r"[^A-Z0-9]", "", (s or "").upper())
words = lambda s: set(re.findall(r"[a-z]{3,}|\d+(?:\.\d+)?", (s or "").lower()))
blister = lambda f: k(f["code"]).endswith("PK") or "blister" in (f["variant"] + f["name"]).lower()

db = sqlite3.connect(ROOT / "database" / "database.sqlite")
items = [dict(zip(("sku", "name", "price", "active", "tags", "image", "type"), r))
         for r in db.execute("select sku,name,price,is_active,tags,image,type from products where brand='Omni'")]
live = [i for i in items if i["active"]]
by_sku = {k(i["sku"]): i for i in items}
taken = {i["sku"].upper() for i in items}

def similar(name, pool):
    """Closest Omni item by shared words, for a photo and a type."""
    w = words(name)
    return max(pool, key=lambda i: len(w & words(i["name"])) / max(1, len(w | words(i["name"]))))

tags, new, kept, revived = {}, [], [], {}
for f in csv.DictReader(open(SRC, encoding="utf-8")):
    code, srp = k(f["code"]), float(f["srp"]) if f["srp"] else None
    if not code or srp is None:
        continue  # no code to search by, or no price: nothing to add
    pk = blister(f)
    base = code[:-2] if code.endswith("PK") else code
    if pk:
        # Blister packs are their own SKU at their own price.
        if (base + "PK") in by_sku:
            continue
        same = [i for i in live if k(i["sku"]).startswith(base)]
        if same and any(abs(i["price"] - srp) < 0.01 for i in same):
            continue  # the price list already sells it at this price
    else:
        same = [i for i in live if k(i["sku"]).startswith(code)]
        if same:
            if not any(abs(i["price"] - srp) < 0.01 for i in same):
                kept.append(f"{f['code']} {f['name']}: flyer {srp}, price list {sorted({i['price'] for i in same})}")
            continue
        # Another code for an item the price list has: same family letters, price and wording.
        twins = [i for i in live if k(i["sku"])[:2] == code[:2] and abs(i["price"] - srp) < 0.01
                 and len(words(f["name"]) & words(i["name"])) / max(1, len(words(f["name"]) | words(i["name"]))) >= 0.4]
        if twins:
            for i in twins:
                tags.setdefault(i["sku"], set()).add(f["code"].strip())
            continue

    name = f"Omni {f['name']}".replace("  ", " ").strip()
    if pk and "blister" not in name.lower():
        name += " (Blister Pack)"
    # A hidden item from the sample feed under this code: bring it back with
    # the flyer's name and price instead of adding a second one.
    hidden = [i for i in items if not i["active"] and i["sku"] not in revived and k(i["sku"]).startswith(code)]
    if hidden:
        best = similar(f["name"], hidden)
        if len(words(f["name"]) & words(best["name"])) / max(1, len(words(f["name"]) | words(best["name"]))) >= 0.3:
            revived[best["sku"]] = {"sku": best["sku"], "name": name[:255], "price": f"{srp:.2f}", "active": "yes", "tags": f["code"].strip()}
            continue

    sku = re.sub(r"[^A-Z0-9]+", "-", f["code"].upper()).strip("-")
    if pk and not sku.endswith("-PK"):
        sku += "-PK"
    if sku in taken and f["variant"]:
        # One flyer code for several sizes (WSO 1- to 4-gang): name the size.
        size = re.sub(r"[^A-Z0-9]+", "-", re.sub(r"(?i)blister|pack", "", f["variant"]).upper()).strip("-")[:20]
        sku = re.sub(r"-PK$", "", sku) + "-" + size + ("-PK" if pk else "")
    while sku in taken:
        sku += "-2"
    taken.add(sku)
    look = similar(f["name"], [i for i in live if k(i["sku"]).startswith(base)] or live)
    new.append({
        "sku": sku, "name": name[:255], "brand": "Omni", "category": "Electrical & Lighting",
        "type": look["type"] or "", "price": f"{srp:.2f}", "stock": 20, "image": look["image"] or "",
        "tags": f["code"].strip(), "active": "yes",
    })

# Two flyer codes, one wording (DP3-WG412 and DP3-WU402): the code tells them apart.
seen = {}
for n in new:
    seen[n["name"]] = seen.get(n["name"], 0) + 1
for n in new:
    if seen[n["name"]] > 1:
        n["name"] = f"{n['name']} {n['tags']}"[:255]

with open(OUT / "omni_flyer_new.csv", "w", encoding="utf-8", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=["sku", "name", "brand", "category", "type", "price", "stock", "image", "tags", "active"], lineterminator="\n")
    w.writeheader()
    w.writerows(new)
with open(OUT / "omni_flyer_tags.csv", "w", encoding="utf-8", newline="") as fh:
    w = csv.writer(fh, lineterminator="\n")
    w.writerow(["sku", "tags"])
    for sku, codes in tags.items():
        old = json.loads(next(i["tags"] for i in items if i["sku"] == sku) or "[]")
        w.writerow([sku, "|".join(dict.fromkeys([*old, *sorted(codes)]))])

with open(OUT / "omni_flyer_revive.csv", "w", encoding="utf-8", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=["sku", "name", "price", "active", "tags"], lineterminator="\n")
    w.writeheader()
    w.writerows(revived.values())

print(f"new items: {len(new)}; hidden items brought back: {len(revived)}; items tagged with flyer codes: {len(tags)}")
print("same code, other price (price list kept):", *kept, sep="\n  ")
