"""Pull the priority brands from khmtools.com.ph's public Shopify feed.

PLACEHOLDER SEED ONLY (see PRODUCT.md): the client supplies real names, SKUs,
prices and photos via the admin CSV import before go-live.

Output: scripts/data/seed_items.csv (one row per SKU / variant) + images in
public/images/products/. Re-runnable: already-downloaded images are skipped.

    python scripts/fetch_khm_feed.py            # feed + images
    python scripts/fetch_khm_feed.py --no-images
"""
from concurrent.futures import ThreadPoolExecutor
from html import escape
from html.parser import HTMLParser
import csv, json, pathlib, re, sys, time, urllib.error, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "scripts" / "data"
IMG_DIR = ROOT / "public" / "images" / "products"
UA = {"User-Agent": "LCT-catalog-seed/1.0", "Accept": "image/webp,image/*,*/*"}

# Priority brands, in the client's order. value = khmtools collection handle.
BRANDS = {
    "Royu": "royu-electrical",
    "Omni": "omni",
    "Makita": "makita",
    "Powerhouse": "powerhouse",
    "Wadfow": "wadfow",
    "Ingco": "ingco",
    "Bosch": "bosch",
    "DeWalt": "dewalt",
    "Jackson": "jackson",
    "Meco": "meco",
    "Butterfly": "butterfly",
    "Stanley": "stanley",
    "Ridgid": "ridgid",
    "Sanwa": "sanwa",
}


def get(url):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 or e.code >= 500:
                time.sleep(5 * (attempt + 1))
                continue
            raise
    raise RuntimeError(f"gave up on {url}")


def collection(handle):
    cache = DATA / "raw" / f"{handle}.json"
    if cache.exists() and "--refresh" not in sys.argv:
        return json.loads(cache.read_text(encoding="utf-8"))
    page, out = 1, []
    while page <= 100:  # Shopify caps pagination at 100
        batch = json.loads(get(f"https://khmtools.com.ph/collections/{handle}/products.json?limit=250&page={page}"))["products"]
        if not batch:
            break
        out += batch
        page += 1
        time.sleep(0.5)
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps(out), encoding="utf-8")
    return out


class _Clean(HTMLParser):
    """Keep structure (paragraphs, lists, tables, headings, emphasis); drop
    every attribute, style, script, image and link target."""
    KEEP = {"p", "br", "ul", "ol", "li", "strong", "b", "em", "i", "h2", "h3", "h4", "h5",
            "table", "thead", "tbody", "tr", "td", "th", "hr"}
    DROP = {"style", "script", "iframe", "noscript", "svg"}
    RENAME = {"b": "strong", "i": "em", "h2": "h3"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.skip = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in self.DROP:
            self.skip += 1
        elif not self.skip and tag in self.KEEP:
            tag = self.RENAME.get(tag, tag)
            span = "".join(f' {k}="{int(v)}"' for k, v in attrs if k in ("colspan", "rowspan") and (v or "").isdigit())
            self.out.append(f"<{tag}{span}>")

    def handle_endtag(self, tag):
        if tag in self.DROP:
            self.skip = max(0, self.skip - 1)
        elif not self.skip and tag in self.KEEP and tag not in ("br", "hr"):
            self.out.append(f"</{self.RENAME.get(tag, tag)}>")

    def handle_data(self, data):
        if not self.skip:
            self.out.append(escape(data.replace(" ", " ")))


def clean_html(html):
    c = _Clean()
    c.feed(html or "")
    out = "".join(c.out)
    empty = re.compile(r"<(p|li|ul|ol|strong|em|h3|h4|h5|tbody|thead|table)>(\s|<br>)*</\1>")
    while empty.search(out):  # inner empties can leave outer ones empty
        out = empty.sub("", out)
    out = re.sub(r"(<br>\s*){2,}", "<br>", out)
    out = re.sub(r"[ \t]{2,}", " ", out)
    return out.strip()[:20000]


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:80]


BRAND_KEYS = {b.lower() for b in BRANDS}

# First match wins. Placeholder taxonomy only: the client's own categories
# replace these through the admin import.
CATEGORIES = [
    ("Bits, Blades & Accessories", r"\bbits?\b|disc|blade|hole ?saw|sandpaper|sanding|carbon brush|batter(y|ies)|charger|chuck|spare part|abrasive|cutting wheel|wire (cup )?brush|core bit|chisel bit"),
    ("Power Tools", r"cordless|brushless|\d+ ?v\b|rotary hammer|demolition|hammer drill|impact (driver|wrench)|grinder|drill|polisher|sander|planer|router|jigsaw|circular saw|miter saw|reciprocating|chain ?saw|heat gun|blower|vacuum|power tool|cut[- ]off|trimmer|multi[- ]tool|nibbler|shear"),
    ("Generators, Pumps & Welding", r"generator|compressor|weld|engine|\bpump|pressure washer|inverter"),
    ("Electrical & Lighting", r"wire|cable|breaker|panel|outlet|switch|bulb|lamp|light|\bled\b|fluorescent|extension cord|plug|conduit|electrical|junction|socket outlet|convenience|fan\b|tester|multimeter"),
    ("Plumbing", r"pipe|faucet|valve|fitting|coupling|elbow|\btee\b|shower|sink|water|toilet|drain|bidet|lavatory|plumb|pvc|ppr|hose"),
    ("Measuring & Layout", r"tape rule|measuring|measure|\blevel\b|laser|caliper|square|gauge|meter|stud finder"),
    ("Hand Tools", r"wrench|screwdriver|plier|hammer|spanner|socket|hex key|allen|cutter|knife|chisel|file\b|saw|clamp|vise|crowbar|bar\b|snip|punch|tool set|mallet|trowel|scraper"),
    ("Locks & Door Hardware", r"lock|hinge|door|knob|latch|pull handle|lever handle|deadbolt|hasp"),
    ("Fasteners", r"screws?\b(?!driver)|bolt|\bnuts?\b|anchor|nail|rivet|washer|staple"),
    ("Garden & Outdoor", r"garden|grass|hedge|lawn|sprayer|shovel|rake|pruning|wheelbarrow"),
    ("Safety & Workwear", r"glove|goggle|helmet|mask|safety|boot|vest|ear ?muff|respirator|harness"),
    ("Storage & Tool Boxes", r"tool ?box|bag|case|cabinet|organi[sz]er|trolley|cart|chest"),
    ("Paint & Adhesives", r"paint|roller|sealant|adhesive|silicone|epoxy|masking|duct tape|caulk|putty|spray"),
]
CATEGORY_RES = [(name, re.compile(rx, re.I)) for name, rx in CATEGORIES]
UNIT = re.compile(r"^\d+([.,/]\d+)?(V|W|K|MM|CM|M|KG|G|L|ML|PCS?|AH|MAH|HP|A|IN|FT|RPM|OZ|LBS?|X\d+)?$|^E\d+$", re.I)
MODEL = re.compile(r"\b[A-Z0-9][A-Z0-9-]{3,18}\b")


def category(product_type, title):
    text = f"{product_type} {title}"
    for name, rx in CATEGORY_RES:
        if rx.search(text):
            return name
    return "General Hardware"


def model_code(title, brand):
    for tok in MODEL.findall(title):
        if tok.lower() == brand.lower() or UNIT.match(tok):
            continue
        if re.search(r"\d", tok) and re.search(r"[A-Z]", tok):
            return tok.strip("-")
    return None


def clean_tags(tags, brand):
    """Feed tags minus the store's own bookkeeping (brand:, primary:, brand names)."""
    if isinstance(tags, str):
        tags = tags.split(",")
    out, seen = [], set()
    for t in tags:
        t = str(t).strip()
        if " " not in t:
            t = t.replace("-", " ").replace("_", " ")   # slug-style tags
        t = re.sub(r"\s+", " ", t).strip()
        key = t.lower()
        if (not t or ":" in t or key in seen or len(t) > 40
                or any(b in key for b in BRAND_KEYS | {brand.lower()})):  # brand/model tags
            continue
        seen.add(key)
        out.append(t[:1].upper() + t[1:])
    return out[:12]


def main():
    images = "--no-images" not in sys.argv
    DATA.mkdir(parents=True, exist_ok=True)
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    rows, seen, jobs, queued = [], set(), [], set()

    for rank, (brand, handle) in enumerate(BRANDS.items(), 1):
        products = collection(handle)
        kept = 0
        for p in products:
            # Brand collections sometimes hold other vendors; keep the brand's own.
            if brand.lower() not in (p.get("vendor") or "").lower() and brand.lower() not in p["title"].lower():
                continue
            img_by_id = {i["id"]: i["src"] for i in p.get("images", [])}
            first_img = p["images"][0]["src"] if p.get("images") else None
            desc = clean_html(p.get("body_html"))
            gallery = [i["src"].split("?")[0] for i in p.get("images", [])][:10]
            model = model_code(p["title"], brand)
            multi = len(p["variants"]) > 1
            for v in p["variants"]:
                vt = v.get("title") or ""
                khm = (v.get("sku") or "").strip()
                code = model_code(vt, brand) if multi else None
                if not code and model:
                    suffix = re.sub(r"[^A-Z0-9]", "", vt.upper())[:8] if multi else ""
                    code = f"{model}-{suffix}" if suffix else model
                if len(khm) >= 4 and re.search(r"[A-Za-z]", khm):
                    sku = khm          # a real alphanumeric code from the feed
                elif code:
                    sku = code         # model number read off the title
                else:
                    sku = khm if len(khm) >= 4 else f"LCT-{str(v['id'])[-7:]}"
                base, n = sku, 2
                while sku.upper() in seen:
                    sku, n = f"{base}-{n}", n + 1
                seen.add(sku.upper())
                name = p["title"] if vt in ("", "Default Title") else f"{p['title']} {vt}"
                src = img_by_id.get(v.get("image_id")) or (v.get("featured_image") or {}).get("src") or first_img
                img = ""
                if src:  # name the file even with --no-images, so rows keep their photo
                    # variants often share one photo: name the file after the source
                    img = slug(src.split("?")[0].rsplit("/", 1)[-1].rsplit(".", 1)[0]) + ".webp"
                    dest = IMG_DIR / img
                    if images and not dest.exists() and dest not in queued:
                        queued.add(dest)
                        sep = "&" if "?" in src else "?"
                        jobs.append((dest, f"{src}{sep}width=400"))
                rows.append({
                    "sku": sku,
                    "name": name.strip(),
                    "brand": brand,
                    "brand_rank": rank,
                    "category": category(p.get("product_type") or "", p["title"]),
                    "price": v.get("price") or "0",
                    "stock": 20 if v.get("available") else 0,
                    "image": img,
                    "type": (p.get("product_type") or "").strip()[:100],
                    "tags": "|".join(clean_tags(p.get("tags") or [], brand)),
                    "description": desc,
                    # Source photo URLs; the product page caches them on first view.
                    "gallery": "|".join(([src.split("?")[0]] if src else []) + [g for g in gallery if not src or g != src.split("?")[0]]),
                })
                kept += 1
        print(f"{brand:12} {len(products):5} products -> {kept:5} SKUs")

    def download(job):
        dest, url = job
        try:
            dest.write_bytes(get(url))
        except Exception as e:  # row keeps working without a photo
            print("  img fail", dest.name, e)

    print(f"downloading {len(jobs)} images")
    with ThreadPoolExecutor(6) as pool:
        list(pool.map(download, jobs))

    with (DATA / "seed_items.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    print(f"total {len(rows)} SKUs -> {DATA / 'seed_items.csv'}")


if __name__ == "__main__":
    main()
