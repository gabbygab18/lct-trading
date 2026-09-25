"""Boards price sheet (supplier "SPECIAL PRICE" sheet, Sept 2026) + Wixim AVR sheet.

Transcribed by hand from the client's photos/PDF. Rule from the client:
use the NET price (never the crated price) and add 20%. The Wixim AVR sheet
(wixim avr.pdf) replaces the AVR pages of the big Wixim list, also +20%.

Writes scripts/data/supplier_boards.csv in the importer's columns.
"""
import csv, pathlib

OUT = pathlib.Path(__file__).parent / "data" / "supplier_boards.csv"
MARKUP = 1.20

rows = []


def add(sku, name, brand, typ, net, desc="", image=""):
    rows.append({
        "sku": sku, "name": name, "brand": brand, "category": "Boards", "type": typ,
        "price": f"{round(net * MARKUP, 2):.2f}", "stock": 20, "image": image, "description": desc, "active": "yes",
    })


def ficem(brand, code, sizes, senepa=()):
    for mm, net in sizes:
        add(f"{code}-{mm}-4X8", f"{brand} Fiber Cement Board {mm}mm x 4ft x 8ft", brand, "Fiber Cement Board", net)
    for mm, width, net in senepa:
        add(f"{code}-SENEPA-{mm}-{width}IN", f'{brand} Senepa Fiber Cement Plank {mm}mm x {width}" x 8ft', brand, "Fiber Cement Plank", net)


# --- Fiber cement boards ------------------------------------------------
ficem("Flex", "FLEX", [("3.2", 310), ("3.5", 325), ("4.5", 395), ("5.0", 470), ("6.0", 535),
                        ("9.0", 830), ("12.0", 1120), ("16.0", 2305), ("18.0", 2575)])
ficem("Smart", "SMART", [("3.5", 300), ("4.5", 360), ("6.0", 510), ("9.0", 790), ("12.0", 1020)])
# Handwritten net prices on the sheet; 4.5mm and 6.0mm are bracketed "Gardflex".
ficem("Gardner", "GARDNER", [("3.5", 316), ("4.5", 386), ("6.0", 540), ("9.0", 843), ("10.0", 935),
                             ("12.0", 1111), ("16.0", 1673), ("18.0", 1871)],
      [("9", 8, 192), ("9", 10, 230), ("9", 12, 260), ("12", 8, 237), ("12", 10, 278), ("12", 12, 328)])
for r in rows:
    if r["sku"] in ("GARDNER-4.5-4X8", "GARDNER-6.0-4X8"):
        r["name"] = r["name"].replace("Gardner Fiber", "Gardner Gardflex Fiber")
ficem("Shera", "SHERA", [("3.5", 320), ("4.5", 380), ("6.0", 520), ("9.0", 810), ("12.0", 1025), ("18.0", 1770)],
      [("9", 8, 244), ("9", 10, 284), ("9", 12, 308), ("12", 8, 292), ("12", 10, 313), ("12", 12, 361)])
ficem("Duraflex", "DURAFLEX", [("3.5", 287), ("4.5", 358), ("6.0", 503), ("9.0", 783), ("12.0", 1026),
                               ("15.0", 1381), ("16.0", 1435), ("18.0", 1809), ("20.0", 1941)],
      [("9", 8, 198), ("9", 10, 231), ("9", 12, 281), ("12", 8, 257), ("12", 10, 293), ("12", 12, 351)])

# --- MDF (MDF 18mm MR has no price on the sheet: left out) ---------------
PRE = "Pre-order item: LCT confirms the lead time when you order."
for mm, net, pre in [("2.5", 253, True), ("3.0", 310, False), ("4.0", 375, True), ("4.75", 434, False),
                     ("6.0", 510, False), ("9.0", 675, False), ("12.0", 900, False), ("15.0", 1030, True),
                     ("18.0", 1200, False), ("25.0", 1995, True)]:
    add(f"MDF-{mm}-4X8", f"MDF Board {mm}mm x 4ft x 8ft" + (" (Pre-order)" if pre else ""), "MDF", "MDF Board", net, PRE if pre else "")

# --- Phenolic boards ----------------------------------------------------
for mm, color, net in [("10", "Yellow", 855), ("11", "White", 985), ("16", "Yellow", 1065), ("17", "White", 1375)]:
    add(f"MARINEPLEX-{mm}-{color[0]}", f"Marineplex Phenolic Board {mm}mm x 4ft x 8ft ({color})", "Marineplex", "Phenolic Board", net)
CROC = "Crocodile brand: no return, no exchange, no cancellation, no refund."
add("CROCODILE-1/2-4X8", 'Crocodile Phenolic Board 1/2" (7-7.5mm) x 4ft x 8ft', "Crocodile", "Phenolic Board", 535, CROC)
add("CROCODILE-3/4-4X8", 'Crocodile Phenolic Board 3/4" (14.5mm) x 4ft x 8ft', "Crocodile", "Phenolic Board", 795, CROC)
add("IMWOOD-11-12-4X8", "IM Wood Phenolic Board 11-12mm x 4ft x 8ft", "IM Wood", "Phenolic Board", 945)
add("IMWOOD-17-18-4X8", "IM Wood Phenolic Board 17-18mm x 4ft x 8ft", "IM Wood", "Phenolic Board", 1315)

# --- Gypsum -------------------------------------------------------------
G = "Gyproc"
add("GYPROC-12-RE-TE", "Gyproc Gypsum Board 12mm x 4ft x 8ft RE/TE", G, "Gypsum Board", 447)
add("GYPROC-9-RE-TE", "Gyproc Gypsum Board 9mm x 4ft x 8ft RE/TE", G, "Gypsum Board", 387)
add("GYPROC-12-MR-TE", "Gyproc Moisture Resistant Gypsum Board 12mm x 4ft x 8ft MR/TE", G, "Gypsum Board", 648)
add("GYPROC-9-MR-TE", "Gyproc Moisture Resistant Gypsum Board 9mm x 4ft x 8ft MR/TE", G, "Gypsum Board", 569)
add("GYPROC-15.9-RE-TE", 'Gyproc Gypsum Board 15.9mm (5/8") x 4ft x 8ft RE/TE', G, "Gypsum Board", 738)
add("GYPROC-12.7-FS-X", "Gyproc Fire Shield Gypsum Board 12.7mm x 4ft x 8ft Type X", G, "Gypsum Board", 758)
add("GYPROC-15.9-FS-X", "Gyproc Fire Shield Gypsum Board 15.9mm x 4ft x 8ft Type X", G, "Gypsum Board", 997)
add("GYPCOTE-ARM-28KG", "Gypcote All Purpose Ready Mix Compound 28kg", G, "Jointing Compound", 898)
add("GYPREX-PW-9-2X4", "Gyprex Plain White Ceiling Tile 9mm x 2ft x 4ft", G, "Ceiling Tile", 252)
add("GYPREX-GR-9-2X4", "Gyprex Granular Ceiling Tile 9mm x 2ft x 4ft", G, "Ceiling Tile", 252)
add("GYPREX-DD-9-2X4", "Gyprex Dew Drop Ceiling Tile 9mm x 2ft x 4ft", G, "Ceiling Tile", 252)
add("GYPROC-PROFIN-20KG", "Gyproc Profin Jointing Compound 20kg", G, "Jointing Compound", 665)
add("GYPLINE-12-4X8", "Gypline Gypsum Board 12mm x 4ft x 8ft", "Gypline", "Gypsum Board", 410)
add("GYPLINE-9-4X8", "Gypline Gypsum Board 9mm x 4ft x 8ft", "Gypline", "Gypsum Board", 360)
E = "Eastberg"
add("EASTBERG-9-4X8", "Eastberg Gypsum Board 9mm x 4ft x 8ft", E, "Gypsum Board", 373)
add("EASTBERG-12-4X8", "Eastberg Gypsum Board 12mm x 4ft x 8ft", E, "Gypsum Board", 429)
add("EASTBERG-9-MR-4X8", "Eastberg Moisture Resistant Gypsum Board 9mm x 4ft x 8ft MR", E, "Gypsum Board", 478)
add("EASTBERG-12-MR-4X8", "Eastberg Moisture Resistant Gypsum Board 12mm x 4ft x 8ft MR", E, "Gypsum Board", 545)
add("EASTBERG-12-X-4X8", "Eastberg Fire Rated Gypsum Board 12mm x 4ft x 8ft Type X", E, "Gypsum Board", 685)
add("EASTBERG-15-X-4X8", "Eastberg Fire Rated Gypsum Board 15mm x 4ft x 8ft Type X", E, "Gypsum Board", 880)
add("EASTBERG-ECHOSTOP-12", "Eastberg Echostop Acoustic Board 12mm", E, "Gypsum Board", 1123)
add("EASTBERG-TILE-9", "Eastberg Ceiling Tile 9mm", E, "Ceiling Tile", 195)
add("EASTBERG-JC", "Eastberg Jointing Compound", E, "Jointing Compound", 430)

# --- Adhesives / other --------------------------------------------------
add("WEBER-FINEWHITE-20KG", "Weber Fine White Skim Coat 20kg", "Weber", "Tile Adhesive & Skim Coat", 390)
add("WEBER-TAIVIS-25KG", "Weber Taivis Standard Tile Adhesive 25kg", "Weber", "Tile Adhesive & Skim Coat", 230)
for mm, net in [("12", 1420), ("15", 1620), ("18", 1920)]:
    add(f"PP-HOLLOW-{mm}", f"PP Hollow Board {mm}mm", "PP Hollow Board", "PP Hollow Board", net)

# --- Wixim AVR (wixim avr.pdf, "New price on May 2026"; replaces the AVRs in the 2023 list)
AVR_SINGLE = "Single phase, servo motor control with time delay and over-voltage protection. Input 150-250V or 70-140V, output 220V or 110V."
AVR_3SERVO = "Three phase, servo motor control and over-voltage protection."
AVR_3AUTO = "Three phase, full-automatic compensated type."
AVRS = [  # kind, model, protection, dimensions cm, kg, net price
    (AVR_SINGLE, "SVC-500VA", "5A fuse", "19x18x14", "3.5", 4100),
    (AVR_SINGLE, "SVC-1000VA", "7A fuse", "22x21x16", "5.0", 5400),
    (AVR_SINGLE, "SVC-1500VA", "10A fuse", "22x21x16", "6.0", 6100),
    (AVR_SINGLE, "SVC-2000VA", "10A MCB", "24x27x20", "12", 8900),
    (AVR_SINGLE, "SVC-3000VA", "16A MCB", "22x30x25", "13", 11900),
    (AVR_SINGLE, "SVC-5KVA", "25A MCB", "30x47x20", "28", 16900),
    (AVR_SINGLE, "SVC-8KVA", "40A MCB", "36x28x48", "37", 27900),
    (AVR_SINGLE, "SVC-10KVA", "50A MCB", "36x28x48", "38", 29900),
    (AVR_SINGLE, "SVC-15KVA", "75A MCB", "33x40x65", "65", 59000),
    (AVR_SINGLE, "SVC-20KVA", "100A MCB", "33x40x65", "110", 75000),
    (AVR_SINGLE, "SVC-30KVA", "MCCB", "43x53x102", "126", 102000),
    (AVR_SINGLE, "SVC-50KVA", "MCCB", "43x79x129", "200", 160000),
    (AVR_SINGLE, "SVC-60KVA", "MCCB", "43x79x129", "250", 200000),
    (AVR_3SERVO, "SVC-3-1.5KVA", "3A MCB", "40x36x27", "18", 22000),
    (AVR_3SERVO, "SVC-3-3KVA", "5A MCB", "42x38x19", "23", 26000),
    (AVR_3SERVO, "SVC-3-4.5KVA", "8A MCB", "42x38x19", "27", 32000),
    (AVR_3SERVO, "SVC-3-6KVA", "10A MCB", "37x28x68", "39", 44000),
    (AVR_3SERVO, "SVC-3-9KVA", "15A MCB", "37x33x78", "48", 50000),
    (AVR_3SERVO, "SVC-3-12KVA", "20A MCB", "43x38x73", "76", 84000),
    (AVR_3SERVO, "SVC-3-15KVA", "25A MCB", "43x38x73", "85", 89000),
    (AVR_3SERVO, "SVC-3-20KVA", "32A MCB", "51x43x91", "124", 110000),
    (AVR_3SERVO, "SVC-3-30KVA", "50A MCB", "51x43x91", "131", 137000),
    (AVR_3AUTO, "SBW-50KVA", "", "60x75x121", "315", 210000),
    (AVR_3AUTO, "SBW-60KVA", "", "60x75x121", "320", 300000),
    (AVR_3AUTO, "SBW-80KVA", "", "65x80x137", "460", 330000),
    (AVR_3AUTO, "SBW-100KVA", "", "65x80x137", "480", 450000),
]


def avr_image(model):
    """The sheet has four photos, stacked beside the rows they belong to."""
    if model.startswith(("SVC-3-", "SBW-")):
        return "wixim-avr-3phase.webp"
    if model in ("SVC-500VA", "SVC-1000VA", "SVC-1500VA", "SVC-2000VA"):
        return "wixim-avr-small.webp"
    if model in ("SVC-3000VA", "SVC-5KVA", "SVC-8KVA", "SVC-10KVA"):
        return "wixim-avr-medium.webp"
    return "wixim-avr-large.webp"


for kind, model, protect, dims, kg, net in AVRS:
    rating = model.rsplit("-", 1)[1]
    label = {AVR_SINGLE: "Single Phase Servo", AVR_3SERVO: "Three Phase Servo", AVR_3AUTO: "Three Phase Full-Automatic"}[kind]
    rows.append({
        "sku": model,
        "name": f"Wixim Automatic Voltage Regulator {rating} {label} ({model})",
        "brand": "Wixim", "category": "Electrical & Lighting", "type": "Automatic Voltage Regulator",
        "price": f"{round(net * MARKUP, 2):.2f}", "stock": 20, "image": avr_image(model),
        "description": f"{kind}" + (f" Protection: {protect}." if protect else "") + f" Size: {dims} cm. Weight: {kg} kg.",
        "active": "yes",
    })

# One photo per product line (found online; see scripts/data/board_photo_sources.txt).
def board_image(r):
    sku, brand, typ = r["sku"], r["brand"], r["type"]
    if brand == "Wixim":
        return r["image"]
    if "SENEPA" in sku:
        return "board-senepa.webp"
    if sku.startswith("GYPCOTE"):
        return "board-gyproc.webp"  # no Gypcote photo found
    if sku.startswith("GYPREX"):
        return "board-gyprex.webp"
    if sku.startswith("GYPROC-PROFIN"):
        return "board-gyproc.webp"  # no Profin photo found
    if sku == "EASTBERG-TILE-9":
        return "board-eastberg-tile.webp"
    if sku == "EASTBERG-JC":
        return "board-eastberg-compound.webp"
    if sku.startswith("WEBER-FINE"):
        return "board-weber-finewhite.webp"
    if sku.startswith("WEBER-TAIVIS"):
        return "board-weber-taivis.webp"
    return {
        "Flex": "board-flex.webp", "Smart": "board-smart.webp", "Gardner": "board-gardner.webp",
        "Shera": "board-shera.webp", "Duraflex": "board-duraflex.webp", "MDF": "board-mdf.webp",
        "Marineplex": "board-marineplex.webp", "Crocodile": "board-crocodile.webp", "IM Wood": "board-imwood.webp",
        "Gyproc": "board-gyproc.webp", "Gypline": "board-gypline.webp", "Eastberg": "board-eastberg.webp",
        "PP Hollow Board": "board-pp-hollow.webp",
    }.get(brand, "")


for r in rows:
    r["image"] = board_image(r)

OUT.parent.mkdir(exist_ok=True)
with OUT.open("w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0]))
    w.writeheader()
    w.writerows(rows)
print(len(rows), "rows ->", OUT)
