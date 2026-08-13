"""Turn camera originals into the two WebP derivatives the photo band needs.

    pip install pillow
    python tools/build-photos.py                 # photos-src/ -> img/thumb + img/full
    python tools/build-photos.py --placeholders 8   # gradient stand-ins, no photos needed
    python tools/build-photos.py --selftest

Originals stay in photos-src/ (gitignored). Only img/ is committed.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "photos-src"
OUT = ROOT / "img"

# thumb is sized to the band tile (~280 CSS px, ~302 when the centre tile scales
# up, x2 for retina), NOT to the viewport. That halves the section's weight.
SIZES = {"thumb": (640, 76), "full": (1600, 80)}
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".bmp"}


def fit(w, h, longest):
    """Scale so the longest edge is `longest`. Never upscale."""
    if max(w, h) <= longest:
        return w, h
    s = longest / max(w, h)
    return max(1, round(w * s)), max(1, round(h * s))


def convert(path, stem):
    # exif_transpose first: phone and DSLR shots are routinely stored rotated,
    # and the orientation tag is dropped on save.
    im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    for kind, (longest, q) in SIZES.items():
        dest = OUT / kind / f"{stem}.webp"
        dest.parent.mkdir(parents=True, exist_ok=True)
        im.resize(fit(*im.size, longest), Image.LANCZOS).save(dest, "WEBP", quality=q, method=6)
        print(f"  {kind:5} {dest.stat().st_size // 1024:4} KB  {dest.relative_to(ROOT)}")
    return max(im.size)  # so the caller can flag originals too small for the tile


def placeholders(n):
    """Stand-ins so the band renders before real photos exist. Same filenames,
    so re-running against photos-src/ overwrites them. Cycled through the site's
    wavelength palette so neighbouring tiles stay visually distinct."""
    from PIL import ImageFont

    palette = [(108, 43, 217), (24, 199, 230), (31, 224, 140), (255, 67, 94)]  # 405/488/532/633
    font = ImageFont.load_default(size=150)
    for i in range(1, n + 1):
        base = palette[(i - 1) % len(palette)]
        im = Image.new("RGB", (1600, 1200))
        d = ImageDraw.Draw(im)
        for y in range(1200):  # fade the accent down into the page background
            t = y / 1200
            d.line([(0, y), (1600, y)], fill=tuple(int(c * (1 - t) * 0.42 + 10) for c in base))
        d.text((800, 600), f"{i:02}", fill=(255, 255, 255), font=font, anchor="mm")
        d.text((800, 760), "PLACEHOLDER", fill=(255, 255, 255), font=ImageFont.load_default(size=44),
               anchor="mm")
        tmp = OUT / f"_ph{i}.png"
        tmp.parent.mkdir(parents=True, exist_ok=True)
        im.save(tmp)
        convert(tmp, f"photo-{i:02}")
        tmp.unlink()


def selftest():
    assert fit(4000, 3000, 640) == (640, 480), fit(4000, 3000, 640)
    assert fit(3000, 4000, 640) == (480, 640), fit(3000, 4000, 640)  # portrait
    assert fit(400, 300, 640) == (400, 300)  # never upscales
    assert fit(1, 1, 640) == (1, 1)
    print("selftest ok")


FIGURE = """      <figure>
        <button type="button" class="shot" data-full="img/full/{stem}.webp">
          <img src="img/thumb/{stem}.webp" alt="{alt}" loading="lazy" decoding="async">
        </button>
      </figure>"""


def collect():
    return sorted(p for p in SRC.rglob("*") if p.is_file() and p.suffix.lower() in EXTS)


def emit_html():
    """Print the <figure> block for every photo, to paste into the .band in index.html.
    Numbering matches what convert() writes, so the two stay in step."""
    n = len(collect())
    for i in range(1, n + 1):
        print(FIGURE.format(stem=f"photo-{i:02}", alt=f"Photo {i}"))
    print(f"\n<!-- {n} figures. The band has no captions; alt is the only text, so set it. -->",
          file=sys.stderr)


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        selftest()
    elif "--placeholders" in sys.argv:
        placeholders(int(sys.argv[sys.argv.index("--placeholders") + 1]))
    elif "--emit-html" in sys.argv:
        emit_html()
    else:
        photos = collect()
        if not photos:
            sys.exit(f"no images in {SRC} — put photos there, or use --placeholders 8")
        skipped = sorted(p for p in SRC.rglob("*") if p.is_file() and p.suffix.lower() not in EXTS)
        failed, small = [], []
        for i, p in enumerate(photos, 1):
            print(p.name)
            try:
                # one bad file shouldn't abandon the other 28
                px = convert(p, f"photo-{i:02}")
                if px < SIZES["thumb"][0]:
                    # plain ASCII: the Windows console codepage mangles em-dashes
                    small.append(f"{p.name} (longest edge {px}px, tile wants {SIZES['thumb'][0]}px)")
            except Exception as e:  # noqa: BLE001 — report and carry on
                failed.append(f"{p.name}: {e}")
        thumbs = sum(f.stat().st_size for f in (OUT / "thumb").glob("*.webp"))
        print(f"\n{len(photos) - len(failed)} converted, thumbs total {thumbs // 1024} KB")
        for label, items in (("skipped (unsupported type)", [p.name for p in skipped]),
                             ("FAILED", failed), ("low resolution", small)):
            if items:
                print(f"\n{label}:")
                for it in items:
                    print(f"  {it}")
