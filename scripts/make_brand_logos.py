"""Brand logos for the homepage LogoLoop -> public/images/brands/<brand>.webp

Sources: khmtools.com.ph brand collection images (13) and wadfow.com (Wadfow).
The white background around each mark is removed (only the white connected to
the image edge, so white inside a mark is kept), then the mark is trimmed and
set to a common height.

    python scripts/make_brand_logos.py <folder with the downloaded originals>
"""
import glob, os, sys
from collections import deque
import numpy as np
from PIL import Image

SRC, OUT, HEIGHT = sys.argv[1], 'public/images/brands', 96
BRANDS = ['royu', 'omni', 'makita', 'powerhouse', 'wadfow', 'ingco', 'bosch',
          'dewalt', 'jackson', 'meco', 'butterfly', 'stanley', 'ridgid', 'sanwa']


def edge_background(light):
    """Pixels of `light` (bool array) reachable from the image border."""
    h, w = light.shape
    seen = np.zeros_like(light)
    q = deque((y, x) for y in range(h) for x in (0, w - 1) if light[y, x])
    q.extend((y, x) for x in range(w) for y in (0, h - 1) if light[y, x])
    for y, x in q:
        seen[y, x] = True
    while q:
        y, x = q.popleft()
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= ny < h and 0 <= nx < w and light[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
    return seen


os.makedirs(OUT, exist_ok=True)
for name in BRANDS:
    src = next(p for p in glob.glob(os.path.join(SRC, name + '.*')) if not p.endswith('.html'))
    a = np.array(Image.open(src).convert('RGBA')).astype(np.float32)

    if name == 'wadfow':
        # shipped white-on-transparent for a dark header: use its dark version
        a[..., :3] = np.where(a[..., 3:4] > 0, [27, 27, 29], a[..., :3])
    else:
        lightness = a[..., :3].min(axis=2)
        bg = edge_background(lightness > 200)
        # soft matte: pure white -> 0, light fringe -> partial, ink untouched
        matte = np.clip((255 - lightness) / 55, 0, 1)
        a[..., 3] = np.where(bg, a[..., 3] * matte, a[..., 3])

    im = Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')
    im = im.crop(Image.fromarray((a[..., 3] > 16).astype(np.uint8) * 255).getbbox())
    im = im.resize((max(1, round(im.width * HEIGHT / im.height)), HEIGHT), Image.LANCZOS)
    im.save(os.path.join(OUT, name + '.webp'), lossless=True, method=6)

    b = np.array(im)
    boxed = ((b[..., 3] > 200) & (b[..., :3].min(axis=2) > 235)).mean()
    print(f"{name:11} {im.size}  transparent {(b[..., 3] == 0).mean():.2f}  leftover white {boxed:.3f}")
