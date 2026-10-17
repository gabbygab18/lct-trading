"""Merge extracted supplier price lists into one import sheet, without duplicates.

    python scripts/merge_imports.py <dir with extraction CSVs> <out.csv>

Each input CSV follows the extraction spec (source_file,page,brand,model_code,
name,category,type,unit,printed_price,price_kind,price,photo_group,notes
[,existing_sku]). The script:
  - drops rows without a usable price;
  - collapses duplicates across lists: same brand + same model code (a series
    code shared by many sizes also needs the same numbers), same brand + same
    name, or same brand + same numbers + nearly the same words. A brand's own
    list beats a distributor's (Hapsuy, UFE, Atlanta); among equals the first
    file wins;
  - matches the local catalog (database/database.sqlite) the same ways, plus an
    `existing_sku` / `existing:<sku>` hint. Matched rows update that item
    instead of adding one;
  - gives new items a SKU: the model code, else BRAND-name-slug; codes taken by
    another brand get a brand prefix.
Writes, for the item importer (Admin > Items > Import, in this order):
  <out>.csv          new items
  <out>_updates.csv  price-list fields of items already in the catalog
  <out>_hide.csv     the catalog's own exact repeats, set inactive
plus <out>.groups.csv (one photo per group of new items: a group's photo is
public/images/products/<group>.webp) and <out>.report.txt.
"""
import csv
import json
import re
import sqlite3
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = Path(sys.argv[1]), Path(sys.argv[2])
DISTRIBUTORS = ("hapsuy", "ufe", "atlanta")  # file-name hints for reseller lists
COLS = ["sku", "name", "brand", "category", "type", "price", "stock", "image", "gallery", "tags", "description", "active"]
# Updates carry only what a price list knows: the live site keeps its own
# stock, photos, descriptions and hidden flags.
UPDATE_COLS = ["sku", "name", "brand", "category", "type", "price"]
STOCK = 20  # placeholder: price lists carry no stock counts
# Brands whose whole current range came in a list: their remaining sample-seed
# items carry old prices from the sample feed, so they are hidden.
FULL_LISTS = ("Royu", "Omni", "Firefly")
# Items already in the catalog under another label, found by review.
SKIP = [
    r"^MDI PP Hollow Board",  # = PP-HOLLOW-12/15/18 from the boards sheet
    # Boysen's DP1 resells these Hudson items; the maker's list (CCC) prices them.
    r"^Hudson Strip Ease Paint & Varnish Remover (1L|4L)$",
    r"^Hudson Polyurethane Reducer (1L|4L)$",
]

csv.field_size_limit(10**8)


def norm(s):
    return re.sub(r"[^A-Z0-9]", "", (s or "").upper())


def slug(s, n=48):
    return re.sub(r"[^A-Z0-9]+", "-", (s or "").upper()).strip("-")[:n].strip("-")


def name_key(s):
    # Words and whole numbers: "1.0kVA" is not "10kVA", "1-5/16" is not "15/16".
    return " ".join(re.findall(r"[A-Z]+|\d+(?:[./]\d+)*", (s or "").upper()))


def code_key(c):
    # Keep dots and slashes: TND1-SVC-1.0/AF (1 kVA) is not TND1-SVC-10/AF.
    return re.sub(r"[\s_-]", "", (c or "").upper())


def numbers(name):
    # Fractions stay whole and repeats count: 1-1/2" is (1, 1/2), not 2-1/2".
    return tuple(sorted(re.findall(r"\d+(?:[./]\d+)*", name)))


def words(name):
    return set(re.findall(r"[a-z]{3,}", name.lower()))


def closest(name, candidates, name_of, floor=0.75):
    """The one candidate worded like `name` (>= 75% shared words), or None if
    none is close or two are equally close. Callers pre-filter on brand and
    numbers, so "4 Pcs/Set" never meets "6 Pcs/Set"."""
    w = words(name)
    scored = sorted(((len(w & words(name_of(c))) / len(w | words(name_of(c))), i) for i, c in enumerate(candidates) if w | words(name_of(c))), reverse=True)
    if not scored or scored[0][0] < floor or (len(scored) > 1 and scored[1][0] == scored[0][0]):
        return None
    return candidates[scored[0][1]]


def brand_code(b):
    w = re.sub(r"[^A-Za-z0-9 ]", "", b).split()
    return (w[0][:4] if len(w) == 1 else "".join(x[0] for x in w[:3])).upper() or "LCT"


# ---- live catalog
db = sqlite3.connect(ROOT / "database" / "database.sqlite")
db.row_factory = sqlite3.Row
existing = {r["sku"].upper(): dict(r) for r in db.execute("select sku,name,brand,category,type,price,stock,image,gallery,is_placeholder,is_active from products")}
by_brand_name = {(norm(r["brand"]), name_key(r["name"])): r for r in existing.values()}
by_brand_code = {(norm(r["brand"]), norm(r["sku"])): r for r in existing.values()}
by_brand_numbers = defaultdict(list)  # for names worded differently
for r in existing.values():
    by_brand_numbers[(norm(r["brand"]), numbers(r["name"]))].append(r)
# The sample seed often puts the maker's code inside the name under its own
# SKU ("RIDGID 40043 micro CA-25", SKU CA-25), so index those codes too. Plain
# sizes like 300M or 18V are not codes.
by_brand_code_in_name = defaultdict(list)
for r in existing.values():
    for t in set(re.findall(r"[A-Z0-9][A-Z0-9./-]*[A-Z0-9]", r["name"].upper())):
        if re.search(r"\d", t) and not re.fullmatch(r"\d{1,4}(\.\d+)?(MM|CM|M|V|W|A|KG|G|L|ML|PCS?|HP|KVA|AH|MAH|FT|IN|LBS?|OZ|T|TONS?)?", t):
            by_brand_code_in_name[(norm(r["brand"]), code_key(t))].append(r)

# ---- read extractions
rows, dropped = [], []
for f in sorted(SRC.glob("*.csv")):
    for r in csv.DictReader(open(f, encoding="utf-8-sig", newline="")):
        r["_file"] = f.name
        try:
            price = round(float(re.sub(r"[^\d.]", "", r.get("price") or "")), 2)
        except ValueError:
            price = 0
        if any(re.search(p, r.get("name") or "", re.I) for p in SKIP):
            dropped.append(f"{f.name} p{r.get('page')}: {r.get('name')!r} (already in the catalog under another label)")
            continue
        if price <= 0 or not (r.get("name") or "").strip() or not (r.get("brand") or "").strip():
            dropped.append(f"{f.name} p{r.get('page')}: {r.get('name')!r} (price {r.get('price')!r})")
            continue
        r["price"] = f"{price:.2f}"
        r["brand"] = r["brand"].strip()
        r["name"] = re.sub(r"\s+", " ", r["name"]).strip()[:255]
        r["_dist"] = any(d in (r.get("source_file") or "").lower() for d in DISTRIBUTORS)
        rows.append(r)

# Own-brand lists first, so they win duplicates.
rows.sort(key=lambda r: r["_dist"])

# ---- collapse duplicates among new rows
# A code printed on one row of a list names that item; a code on many rows is a
# series (Dormer A-130 in 60 sizes), so it only matches with the same numbers.
per_file = defaultdict(int)
for r in rows:
    per_file[(r["_file"], norm(r["brand"]), code_key(r.get("model_code")))] += 1
seen, merged, conflicts, fuzzy, reworded = {}, [], [], defaultdict(list), []
for r in rows:
    b = norm(r["brand"])
    code = code_key(r.get("model_code"))
    keys = []
    if code:
        if per_file[(r["_file"], b, code)] == 1:
            keys.append(("code", b, code))
        keys.append(("code+numbers", b, code, numbers(r["name"])))
    keys.append(("name", b, name_key(r["name"])))
    hit = next((seen[k] for k in keys if k in seen), None)
    # One list printing the same code for two different items (e.g. two colour
    # temperatures): both are real; only a repeat across lists is a duplicate.
    if hit and hit["_file"] == r["_file"] and name_key(hit["name"]) != name_key(r["name"]):
        hit = seen.get(keys[-1])
    if not hit:
        # Same item worded differently in another list; two printed codes = two items.
        others = [m for m in fuzzy[(b, numbers(r["name"]))] if m["_file"] != r["_file"] and not (code and code_key(m.get("model_code")))]
        hit = closest(r["name"], others, lambda m: m["name"]) if numbers(r["name"]) else None
        if hit:
            reworded.append(f"{r['name']} ({r['_file']}) = {hit['name']} ({hit['_file']})")
    if hit:
        if hit["price"] != r["price"]:
            conflicts.append(f"{r['brand']} {r.get('model_code') or r['name']}: kept {hit['price']} ({hit['_file']}), skipped {r['price']} ({r['_file']})")
        continue
    for k in keys:
        seen[k] = r
    fuzzy[(b, numbers(r["name"]))].append(r)
    merged.append(r)

# ---- match the live catalog, assign SKUs
out, updated, new_groups, taken, claimed = [], [], defaultdict(list), set(existing), set()
for r in merged:
    b = norm(r["brand"])
    hint = (r.get("existing_sku") or "").strip().upper()
    m = re.search(r"existing:([^\s;,]+)", r.get("notes") or "")
    hint = hint or (m.group(1).upper() if m else "")
    code = norm(r.get("model_code"))
    match = (existing.get(hint) if hint else None) \
        or (by_brand_code.get((b, code)) if code else None) \
        or by_brand_name.get((b, name_key(r["name"])))
    if not match and code and len(code_key(r.get("model_code"))) >= 4:
        named = [e for e in by_brand_code_in_name[(b, code_key(r.get("model_code")))] if e["sku"] not in claimed]
        # One item carries the code: that's it. Several (colours, reel sizes): the closest wording, if any.
        match = named[0] if len(named) == 1 else closest(r["name"], named, lambda e: e["name"], 0.4)
        if match:
            reworded.append(f"{r['name']} ({r['_file']}) = {match['sku']} {match['name']} (catalog, code in name)")
    if not match and numbers(r["name"]):
        match = closest(r["name"], [e for e in by_brand_numbers[(b, numbers(r["name"]))] if e["sku"] not in claimed], lambda e: e["name"])
        if match:
            reworded.append(f"{r['name']} ({r['_file']}) = {match['sku']} {match['name']} (catalog)")
    if match:
        claimed.add(match["sku"])

    if match:
        # Update in place: keep the SKU, photo, gallery and stock it already has.
        out.append({
            # Brand's own list (or a sample item): its name wins; a distributor's doesn't.
            "sku": match["sku"], "name": r["name"] if match["is_placeholder"] or not r["_dist"] else match["name"],
            "brand": r["brand"], "category": r["category"] or match["category"], "type": r.get("type") or match["type"] or "",
            "price": r["price"], "stock": match["stock"], "image": match["image"] or "", "gallery": "|".join(json.loads(match["gallery"] or "[]")),
            "tags": "", "description": "", "active": "yes",
        })
        updated.append(f"{match['sku']}: {match['price']} -> {r['price']} ({r['_file']})")
        continue

    sku = slug(r.get("model_code"), 60) if code else f"{brand_code(r['brand'])}-{slug(r['name'].removeprefix(r['brand']), 48)}"
    if sku.upper() in taken:  # code used by another brand (or twice): prefix the brand
        sku = f"{brand_code(r['brand'])}-{sku}"[:64]
    n = 2
    base = sku
    while sku.upper() in taken:
        sku = f"{base[:60]}-{n}"
        n += 1
    taken.add(sku.upper())
    out.append({
        "sku": sku, "name": r["name"], "brand": r["brand"], "category": r["category"], "type": r.get("type", ""),
        "price": r["price"], "stock": STOCK, "image": "", "gallery": "", "tags": "", "description": "",
        # A bare code with no product name ("Amerilock AL 2531") stays hidden until named in the admin.
        "active": "no" if "type not identified" in (r.get("notes") or "") else "yes",
        "_group": r.get("photo_group") or slug(r["brand"] + " " + (r.get("type") or ""), 40).lower(),
        "_file": r["_file"], "_code": r.get("model_code", ""), "_notes": r.get("notes", ""), "_src": r.get("source_file", ""), "_page": r.get("page", ""),
    })
    g = out[-1]["_group"]
    if (ROOT / "public" / "images" / "products" / f"{g}.webp").exists():
        out[-1]["image"] = f"{g}.webp"  # installed by install_hd_photos.py
    new_groups[g].append(sku)

# No photo found for a group: borrow one from the same brand's same product
# type (another size or model of that line), from this import or the catalog.
by_type_photo = {}
for e in existing.values():
    if e["image"] and e["type"]:
        by_type_photo.setdefault((norm(e["brand"]), (e["type"] or "").lower()), e["image"])
for r in out:
    if r.get("_group") and r["image"] and r["type"]:
        by_type_photo[(norm(r["brand"]), r["type"].lower())] = r["image"]
borrowed = 0
for r in out:
    if r.get("_group") and not r["image"] and r["type"]:
        r["image"] = by_type_photo.get((norm(r["brand"]), r["type"].lower()), "")
        borrowed += bool(r["image"])

for path, cols, part in ((OUT, COLS, [r for r in out if r.get("_group")]),
                         (OUT.with_name(OUT.stem + "_updates.csv"), UPDATE_COLS, [r for r in out if not r.get("_group")])):
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore", lineterminator="\n")
        w.writeheader()
        w.writerows(part)
with open(OUT.with_suffix(".groups.csv"), "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f, lineterminator="\n")
    w.writerow(["photo_group", "brand", "example_name", "source_file", "page", "notes", "has_photo", "skus"])
    for g, skus in new_groups.items():
        first = next(r for r in out if r["sku"] == skus[0])
        w.writerow([g, first["brand"], first["name"], first["_src"], first["_page"], first["_notes"][:120], "yes" if first["image"] else "", "|".join(skus)])

# Same product under another brand label: a catalog brand within the first
# words of a new item's name (e.g. "MDI PP Hollow Board 12mm" vs brand
# "PP Hollow Board"; not a colour like "Satin Butterfly"), same category and
# same numbers. Different brands that merely make the same kind of product
# are not duplicates.
by_brand = defaultdict(list)
for e in existing.values():
    by_brand[e["brand"]].append(e)
near = []
for r in out:
    if not r.get("_group"):
        continue
    for b, items in by_brand.items():
        if norm(b) != norm(r["brand"]) and len(b) > 3 and re.match(rf"(\S+ ){{0,2}}{re.escape(b)}(?!\w)", r["name"], re.I):
            for e in items:
                # Same category too: "Satin Butterfly" paint is not a Butterfly ladder.
                if e["category"] == r["category"] and numbers(e["name"]) and numbers(e["name"]) == numbers(r["name"]):
                    near.append(f"{r['sku']} | {r['name']} | {r['price']}  ~  {e['sku']} | {e['name']} | {e['brand']} | {e['price']}")

# Same brand, worded differently: a new item whose words mostly match a catalog
# item, or a new item from another list, with the same numbers ("Cushion Grip
# Screwdriver (4 pcs/set)" vs "Cushion Grip Screwdriver Set (4 Pcs/Set)").
# Two different printed codes mean two products, so those pairs are skipped.
pool = defaultdict(list)  # (brand, numbers) -> [(source, sku, code, name)]
for e in existing.values():
    pool[(norm(e["brand"]), numbers(e["name"]))].append(("catalog", e["sku"], "", e["name"]))
for r in out:
    if r.get("_group"):
        pool[(norm(r["brand"]), numbers(r["name"]))].append((r["_file"], r["sku"], code_key(r["_code"]), r["name"]))
same_brand = []
for (b, nums), items in pool.items():
    if not nums or len(items) > 300:  # ponytail: O(n^2) per bucket; huge buckets are size-less families
        continue
    for i, (sa, ka, ca, na) in enumerate(items):
        for sb, kb, cb, nb in items[i + 1:]:
            if sa == sb or (ca and cb) or "catalog" == sa == sb:
                continue
            wa, wb = words(na), words(nb)
            if wa and wb and len(wa & wb) / len(wa | wb) >= 0.75:
                same_brand.append(f"{kb} | {nb} ({sb})  ~  {ka} | {na} ({sa})")

# The catalog's own repeats (the sample seed listed some items twice): same
# brand, name and price. Keep the one this import updates, else the one with a
# photo, else the shortest SKU; hide the rest. Same name at another price is
# usually another pack size, so it is only reported.
after = {sku: dict(e) for sku, e in existing.items()}  # names and prices once imported
for r in out:
    if not r.get("_group"):
        after[r["sku"].upper()].update(name=r["name"], brand=r["brand"], price=float(r["price"]))
repeats, hide, odd = defaultdict(list), [], []
for e in after.values():
    if e["is_active"]:
        repeats[(norm(e["brand"]), name_key(e["name"]))].append(e)
for items in repeats.values():
    if len(items) < 2:
        continue
    # Sample-seed copies are expendable at any price; real items at two prices need a person.
    spare = [e for e in items if e["sku"] not in claimed]
    if len({e["price"] for e in items}) > 1 and not all(e["is_placeholder"] for e in spare):
        odd.append(" / ".join(f"{e['sku']} {e['name']} {e['price']}" for e in items))
        continue
    keep = min(items, key=lambda e: (e["sku"] not in claimed, not e["image"], len(e["sku"]), e["sku"]))
    hide += [e["sku"] for e in items if e is not keep]

# Sample-seed items that carry the code of an item the price list now adds,
# but could not be paired one to one (one seed item per wire colour; Ridgid
# accessories filed under their machine's name). The real list replaces them.
replaced = []
for r in out:
    code = code_key(r.get("_code"))
    if r.get("_group") and len(code) >= 4 and re.search(r"\d", code):
        for e in by_brand_code_in_name[(norm(r["brand"]), code)]:
            if e["is_placeholder"] and e["is_active"] and e["sku"] not in claimed and e["sku"] not in hide:
                hide.append(e["sku"])
                replaced.append(f"{e['sku']} {e['name']}  ->  {r['sku']} {r['name']}")
full = {norm(b) for b in FULL_LISTS}
for e in existing.values():
    if norm(e["brand"]) in full and e["is_placeholder"] and e["is_active"] and e["sku"] not in claimed and e["sku"] not in hide:
        hide.append(e["sku"])
        replaced.append(f"{e['sku']} {e['name']}  (not in the {e['brand']} list)")
with open(OUT.with_name(OUT.stem + "_hide.csv"), "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f, lineterminator="\n")
    w.writerow(["sku", "active"])
    w.writerows([sku, "no"] for sku in hide)

report = [
    f"rows read: {len(rows)}; dropped (no price/name): {len(dropped)}; duplicates collapsed: {len(rows) - len(merged)}",
    f"update existing items: {len(updated)}; new items: {len(out) - len(updated)}; new photo groups: {len(new_groups)}; photos borrowed from the same brand and type: {borrowed}",
    "", "== possible duplicates under another brand (review)", *near,
    "", "== possible duplicates, same brand worded differently (review)", *same_brand,
    "", "== matched though worded differently", *reworded,
    "", "== price conflicts between lists (first kept)", *conflicts,
    "", f"== catalog repeats hidden ({len(hide)}, see _hide.csv)", *hide,
    "", "== catalog items with the same name at different prices (review)", *odd,
    "", f"== sample items replaced by a price-list item with their code ({len(replaced)})", *replaced,
    "", "== dropped", *dropped,
    "", "== updates", *updated,
]
OUT.with_suffix(".report.txt").write_text("\n".join(report), encoding="utf-8")
print("\n".join(report[:2]))
