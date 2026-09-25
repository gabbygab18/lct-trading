"""Setsu photos, v2: the catalog embeds each product as a transparent PNG.
Pull that original (full resolution, real alpha) instead of screenshotting
the page, then set it on white. Each old crop box picks the embedded image
that sits in it.

    python scripts/hd_setsu_photos.py <setsu_build.py> <out dir>
"""
import ast, re, sys, pathlib
import pymupdf
from PIL import Image

PDF = pathlib.Path(__file__).resolve().parent.parent / "1784952863510905.pdf"
src = pathlib.Path(sys.argv[1]).read_text()
clips = ast.literal_eval(re.search(r"clips = (\{.*?\n\})", src, re.S).group(1))
out = pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
d = pymupdf.open(PDF)


def candidates(page):
    for img in page.get_images(full=True):
        xref, smask, w, h = img[0], img[1], img[2], img[3]
        if not smask or w > 2000 or min(w, h) < 120:   # banners, background shapes, icons
            continue
        for r in page.get_image_rects(xref):
            if r.width > page.rect.width * 0.6:
                continue
            yield xref, smask, r


# Picked by hand where the product image sits partly outside the old crop box.
FORCE = {(4, 1): 133, (4, 2): 162, (4, 3): 2356, (7, 2): 334, (7, 3): 335, (9, 1): 410,
         (10, 3): 501, (11, 4): 573, (11, 6): 575, (15, 1): 783}

report = []
for (p, n), c in clips.items():
    page = d[p - 1]
    box = pymupdf.Rect(c)
    best, score = None, 0
    for xref, smask, r in candidates(page):
        inter = (r & box).get_area()
        s = inter / max(r.get_area(), 1)          # how much of the image is inside the old crop
        s *= min(1, inter / max(box.get_area() * 0.15, 1))  # and it isn't a speck
        if s > score:
            best, score = (xref, smask, r), s
    if (p, n) in FORCE:
        x = FORCE[(p, n)]
        sm = next(i[1] for i in page.get_images(full=True) if i[0] == x)
        best, score = (x, sm, None), 1.0
    if not best or score < 0.35:
        report.append(f"p{p}-{n}: no cut-out found (kept old crop)")
        continue
    xref, smask, r = best
    pix = pymupdf.Pixmap(pymupdf.Pixmap(d, xref), pymupdf.Pixmap(d, smask))
    im = Image.frombytes("RGBA", (pix.width, pix.height), pix.samples)
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 10 else 0).getbbox())
    side = int(max(im.size) * 1.12)
    canvas = Image.new("RGB", (side, side), "white")
    canvas.paste(im, ((side - im.width) // 2, (side - im.height) // 2), im)
    canvas.thumbnail((900, 900), Image.LANCZOS)
    canvas.save(out / f"setsu-p{p}-{n}.png")
    report.append(f"p{p}-{n}: xref {xref} {pix.width}x{pix.height} (overlap {score:.2f})")

print("\n".join(report))
