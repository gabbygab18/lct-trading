"""Merge the client's supplier price lists into one import sheet.

Inputs (made by hand / by the extraction step):
  <extract dir>/wixim_*.csv   Wixim 2023 price list (raw unit price)      -> +20%
  <extract dir>/setsu.csv     Setsu lighting catalog (SRP)                -> as listed
  scripts/data/supplier_boards.csv  boards sheet + Wixim AVR sheet (already priced)
  <extract dir>/img/*         photos cut from the PDFs / found online

Output:
  scripts/data/supplier_items.csv   importer columns, ready for Admin > Excel / CSV upload
  public/images/products/<file>.webp  photos, 600px max, webp

    python scripts/supplier_import.py <extract dir>
"""
import csv, glob, os, pathlib, re, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = pathlib.Path(sys.argv[1])
IMG_OUT = ROOT / "public" / "images" / "products"
OUT = ROOT / "scripts" / "data" / "supplier_items.csv"
COLS = ["sku", "name", "brand", "category", "type", "price", "stock", "image", "description", "active"]
STOCK = 20  # placeholder: the price lists carry no stock counts


def webp(name):
    """Convert an extracted photo to public/images/products/<base>.webp; returns the new name."""
    if not name:
        return ""
    base = pathlib.Path(name).stem
    found = [p for p in glob.glob(str(SRC / "img" / (base + ".*")))]
    if not found:
        return ""
    dest = IMG_OUT / f"{base}.webp"
    if not dest.exists():
        im = Image.open(found[0])
        im = im.convert("RGBA") if im.mode in ("P", "LA", "RGBA") else im.convert("RGB")
        if im.mode == "RGBA":  # flatten onto white: product wells are white
            bg = Image.new("RGB", im.size, "white")
            bg.paste(im, mask=im.getchannel("A"))
            im = bg
        im.thumbnail((600, 600), Image.LANCZOS)
        im.save(dest, quality=84, method=6)
    return dest.name


def clean_price(s):
    s = re.sub(r"[^\d.]", "", str(s or ""))
    return float(s) if s and s != "." else None


rows, problems = [], []
PREFIX = {"Wixim": "WX", "Setsu": "ST"}

# Codes already used by the sample catalog: a supplier item with the same code
# would overwrite that sample on import, so it gets a brand prefix instead.
SAMPLE = ROOT / "scripts" / "data" / "seed_items.csv"
TAKEN = set()
if SAMPLE.exists():
    csv.field_size_limit(10**7)
    with SAMPLE.open(newline="", encoding="utf-8") as f:
        TAKEN = {r["sku"].upper() for r in csv.DictReader(f)}


def take(path, brand, markup, category):
    with open(path, newline="", encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            price = clean_price(r.get("raw_price"))
            sku = (r.get("sku") or "").strip().upper()
            if sku.isdigit() or sku in TAKEN:  # "1021", or a code a sample item already uses
                problems.append(f"{sku} renamed {PREFIX.get(brand, brand[:2].upper())}-{sku} (clashes with another item's code)") if sku in TAKEN else None
                sku = f"{PREFIX.get(brand, brand[:2].upper())}-{sku}"
            if not sku or price is None or price <= 0:
                problems.append(f"{os.path.basename(path)} p{r.get('page')}: skipped {r.get('sku')!r} (price {r.get('raw_price')!r})")
                continue
            rows.append({
                "sku": sku[:64],
                "name": (r.get("name") or "").strip()[:255],
                "brand": brand,
                "category": category,
                "type": (r.get("type") or "").strip()[:100],
                "price": f"{round(price * markup, 2):.2f}",
                "stock": STOCK,
                "image": webp(r.get("image")),
                "description": "",
                "active": "yes",
            })


for path in sorted(glob.glob(str(SRC / "wixim_*.csv"))):
    take(path, "Wixim", 1.20, "Electrical & Lighting")
if (SRC / "setsu.csv").exists():
    take(SRC / "setsu.csv", "Setsu", 1.00, "Electrical & Lighting")

with open(ROOT / "scripts" / "data" / "supplier_boards.csv", newline="", encoding="utf-8") as f:
    for r in csv.DictReader(f):
        r["image"] = webp(r["image"])
        rows.append({k: r.get(k, "") for k in COLS})

# Duplicate SKUs across files: keep the first, report the rest.
seen, unique = {}, []
for r in rows:
    key = r["sku"].upper()
    if key in seen:
        problems.append(f"duplicate SKU {r['sku']}: kept {seen[key]['name']!r}, dropped {r['name']!r}")
        continue
    seen[key] = r
    unique.append(r)

with OUT.open("w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=COLS)
    w.writeheader()
    w.writerows(unique)

by_brand = {}
for r in unique:
    by_brand[r["brand"]] = by_brand.get(r["brand"], 0) + 1
print(f"{len(unique)} items -> {OUT}")
print("by brand:", by_brand)
print("without photo:", sum(1 for r in unique if not r["image"]))
for p in problems:
    print("  !", p)
