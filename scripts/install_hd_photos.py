"""Install HD product photos found online over the catalog crops.

Each <dir>/<photo>.(jpg|png|webp) becomes public/images/products/<photo>.webp:
flattened onto white, trimmed, centred on a square, 800px. Too-small or
unreadable files are skipped and listed.

    python scripts/install_hd_photos.py <dir>
"""
import glob, os, pathlib, sys
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEST = ROOT / "public" / "images" / "products"
SRC = pathlib.Path(sys.argv[1])
MIN_SIDE = 450

done, skipped = 0, []
for f in sorted(glob.glob(str(SRC / "*.*"))):
    base, ext = os.path.splitext(os.path.basename(f))
    if ext.lower() not in (".jpg", ".jpeg", ".png", ".webp"):
        continue
    try:
        im = Image.open(f)
        im.load()
    except Exception as e:
        skipped.append(f"{base}: unreadable ({e})")
        continue
    if min(im.size) < MIN_SIDE:
        skipped.append(f"{base}: too small {im.size}")
        continue
    if im.mode in ("P", "LA", "RGBA"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, "white")
        bg.paste(im, mask=im.getchannel("A"))
        im = bg
    im = im.convert("RGB")
    a = np.asarray(im.convert("L"))
    ys, xs = np.where(a < 240)
    if len(xs):
        im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    side = int(max(im.size) * 1.1)
    canvas = Image.new("RGB", (side, side), "white")
    canvas.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    canvas = canvas.resize((800, 800), Image.LANCZOS)
    canvas.save(DEST / f"{base}.webp", quality=86, method=6)
    done += 1

print(f"installed {done} HD photos")
for s in skipped:
    print("  skipped", s)
