"""Wixim photos, v2: rebuild each product photo from the image embedded in the
PDF instead of a screenshot of the page (no table lines or printed text, no
second resampling), then trim, set on white and upscale to 800px.

The catalog's own photos are small (~150-400px), so this is as sharp as the
source allows; true HD needs Wixim's original photo files.

    python scripts/hd_wixim_photos.py <img dir with wixim-p*.png> <out dir> [page ...]
"""
import glob, os, pathlib, re, sys
import cv2
import numpy as np
import pymupdf
from PIL import Image, ImageFilter

PDF = pathlib.Path(__file__).resolve().parent.parent / "Wixim Price List-2023.pdf"
SRC, OUT = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
ONLY = {int(p) for p in sys.argv[3:]}
OUT.mkdir(parents=True, exist_ok=True)
doc = pymupdf.open(PDF)
REF_DPI = 100


def page_gray(page):
    pix = page.get_pixmap(dpi=REF_DPI, colorspace=pymupdf.csGRAY)
    return np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width)


def locate(crop, ref):
    """Where the crop sits on the page, in points (multi-scale template match)."""
    best = (-1, None)
    g = np.asarray(crop.convert("L"))
    for dpi in (200, 150, 220, 250, 300, 180):
        s = REF_DPI / dpi
        w, h = int(g.shape[1] * s), int(g.shape[0] * s)
        if w < 12 or h < 12 or w >= ref.shape[1] or h >= ref.shape[0]:
            continue
        t = cv2.resize(g, (w, h), interpolation=cv2.INTER_AREA)
        res = cv2.matchTemplate(ref, t, cv2.TM_CCOEFF_NORMED)
        _, score, _, loc = cv2.minMaxLoc(res)
        if score > best[0]:
            k = 72 / REF_DPI
            best = (score, pymupdf.Rect(loc[0] * k, loc[1] * k, (loc[0] + w) * k, (loc[1] + h) * k))
        if score > 0.9:
            break
    return best


def embedded(page, box):
    """The embedded image covering the crop, cut to the crop's area, native pixels."""
    best, area = None, 0
    for img in page.get_images(full=True):
        xref = img[0]
        for r in page.get_image_rects(xref):
            inter = (r & box).get_area()
            if inter > area and inter > 0.3 * box.get_area():
                best, area = (xref, r), inter
    if not best:
        return None
    xref, r = best
    pix = pymupdf.Pixmap(doc, xref)
    if pix.n - pix.alpha >= 4:  # CMYK
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    im = Image.frombytes("RGBA" if pix.alpha else "RGB", (pix.width, pix.height), pix.samples)
    if im.mode == "RGBA":
        bg = Image.new("RGB", im.size, "white"); bg.paste(im, mask=im.getchannel("A")); im = bg
    sx, sy = im.width / r.width, im.height / r.height
    c = (box & r)
    sub = im.crop((int((c.x0 - r.x0) * sx), int((c.y0 - r.y0) * sy), int(np.ceil((c.x1 - r.x0) * sx)), int(np.ceil((c.y1 - r.y0) * sy))))
    return sub, sx * 72  # effective dpi of the source


def finish(im):
    """Trim white margins, square it on white, upscale cleanly to 800px."""
    im = im.convert("RGB")
    a = np.asarray(im.convert("L")).copy()
    # Table rules baked into some photos: a thin, long dark line with white
    # around it. Whiten those rows/columns so they don't count as product.
    px = np.array(im)
    for axis in (0, 1):
        dark = (a < 160).mean(axis=1 - axis)  # share of each row (axis 0) / column dark
        n = len(dark)
        for i in range(n):
            if dark[i] > 0.55:
                lo, hi = max(i - 4, 0), min(i + 5, n)
                band = dark[lo:hi]
                if (band > 0.55).sum() <= 3 and (band < 0.15).sum() >= 2:
                    if axis == 0:
                        px[i, :] = 255; a[i, :] = 255
                    else:
                        px[:, i] = 255; a[:, i] = 255
    im = Image.fromarray(px)
    ys, xs = np.where(a < 238)
    if len(xs):
        pad = 2
        im = im.crop((max(xs.min() - pad, 0), max(ys.min() - pad, 0), min(xs.max() + pad, im.width), min(ys.max() + pad, im.height)))
    side = int(max(im.size) * 1.1)
    canvas = Image.new("RGB", (side, side), "white")
    canvas.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    if side < 800:
        canvas = canvas.resize((800, 800), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.6, percent=70, threshold=2))
    else:
        canvas.thumbnail((800, 800), Image.LANCZOS)
    return canvas


refs, done, kept = {}, 0, []
for f in sorted(glob.glob(str(SRC / "wixim-p*.png"))):
    name = os.path.basename(f)
    if not re.match(r"wixim-p\d+-\d+\.png$", name):
        continue  # AVR photos etc. are handled elsewhere
    pno = int(re.match(r"wixim-p0*(\d+)-", name).group(1))
    if ONLY and pno not in ONLY:
        continue
    page = doc[pno - 1]
    if pno not in refs:
        refs[pno] = page_gray(page)
    crop = Image.open(f)
    score, box = locate(crop, refs[pno])
    got = embedded(page, box) if box is not None and score > 0.55 else None
    if not got:
        kept.append(f"{name}: {'not located' if score <= 0.55 else 'no embedded image'} (match {score:.2f})")
        finish(crop.convert("RGB")).save(OUT / name)
        continue
    sub, dpi = got
    finish(sub).save(OUT / name)
    done += 1

print(f"rebuilt {done} from embedded originals; {len(kept)} kept from the old crop")
for k in kept:
    print("  -", k)
