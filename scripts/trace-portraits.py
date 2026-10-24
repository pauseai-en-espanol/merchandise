#!/usr/bin/env python3
"""
Vectorize hand-drawn portraits (ink lines + grey pencil shading on white)
into one-colour or two-colour SVGs for screen print.

    python3 scripts/trace-portraits.py illustrations/portraits/originals illustrations/portraits

Every <name>.jpeg / .jpg / .png in the source folder becomes a folder
<name>/ (one per person) with:

  lines.svg         one ink: the line work only (the darkest hatching
                    survives, the grey shading drops out)
  halftone.svg      one ink: line work + the shading as a 45° dot screen
                    (HALFTONE_CELL_MM cells when printed
                    HALFTONE_PRINT_WIDTH_MM wide)
  tone.svg          two inks: line work in ink + the shading as one flat
                    tone, for white and orange tees
  tone.orange.svg   the same, lines in brand orange, for black tees
  tone.white.svg    the same, lines in white, for black tees

The tone is the line colour faded part of the way toward the tee it is
meant for, the way grey is black faded toward white. All colours come from
brand/tokens.json (the tones are its illustrationColors.portraitTone*).

The illustrators' originals are kept in illustrations/portraits/originals/
as this script's input (the SVGs stay the source of truth: designs never
embed the rasters). Needs Pillow and the potrace CLI (brew install potrace).
"""
import json
import math
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
_TOK = json.loads((ROOT / 'brand/tokens.json').read_text())
INK = _TOK['colors']['ink']['hex']
ORANGE = _TOK['colors']['orange']['hex']
WHITE = _TOK['colors']['paper']['hex']
TONE = {k: _TOK['illustrationColors'][f'portraitTone{k}']['hex'] for k in ('Ink', 'Orange', 'White')}

# Working resolution: the drawing is resized to this width before tracing.
# ~270 dpi at the nominal width; more only adds nodes, not visible detail.
WORK_PX = 1600
# Nominal print width of a portrait: sets the SVG's physical size.
NOMINAL_WIDTH_MM = 150
# The halftone screen is sized for the width the portraits actually print
# at, so its dots hold on fabric there: the portrait-quote tees
# (scripts/draw-portrait-quotes.py) print them 103–108 mm wide. If designs
# print them at another size, change this and re-run.
HALFTONE_PRINT_WIDTH_MM = 106
HALFTONE_CELL_MM = 0.85     # ≈ 30 lines per inch, safe on tees
MIN_DOT_MM = 0.2            # smaller dots don't hold on fabric

LINE_THRESHOLD = 110        # grey level (0-255) below which a pixel is line work
TONE_THRESHOLD = 205        # below which (and above LINE_THRESHOLD) it is shading
PAPER = 236                 # at or above: paper
# A line's anti-aliased edge is mid-grey too: shading thinner than this (px)
# is that edge, not shading, and is dropped so lines don't get a grey rim.
EDGE_PX = 2

COLOURWAYS = {
    # suffix: (line colour, shading tone, tee it is meant for)
    '': (INK, TONE['Ink'], 'white or orange'),
    '.orange': (ORANGE, TONE['Orange'], 'black'),
    '.white': (WHITE, TONE['White'], 'black'),
}


def load(path):
    """Greyscale drawing cropped to its content (plus a margin), WORK_PX wide."""
    im = Image.open(path).convert('L')
    ink = im.point(lambda v: 255 if v < PAPER else 0)
    x0, y0, x1, y1 = ink.getbbox()
    pad = round(0.02 * im.width)
    im = im.crop((max(0, x0 - pad), max(0, y0 - pad),
                  min(im.width, x1 + pad), min(im.height, y1 + pad)))
    return im.resize((WORK_PX, round(im.height * WORK_PX / im.width)), Image.LANCZOS)


def trace(mask, turdsize, opttolerance):
    """1-bit mask (black = paint) -> potrace path data in pixel space."""
    with tempfile.TemporaryDirectory() as tmp:
        pbm, svg = Path(tmp) / 'in.pbm', Path(tmp) / 'out.svg'
        mask.save(pbm)
        subprocess.run(['potrace', str(pbm), '--svg', '--flat', '-t', str(turdsize),
                        '-O', str(opttolerance), '-u', '10', '-o', str(svg)], check=True)
        out = svg.read_text()
    m = re.search(r'translate\(([-\d.]+),([-\d.]+)\) scale\(([-\d.]+),([-\d.]+)\)', out)
    d = ' '.join(re.findall(r'\sd="([^"]+)"', out))
    tx, ty, sx, sy = (float(v) for v in m.groups())
    return d, f'matrix({sx:g} 0 0 {sy:g} {tx:g} {ty:g})'


def threshold(im, level):
    return im.point(lambda v: 0 if v < level else 255, mode='1')


def grow(mask, px):
    return mask.filter(ImageFilter.MaxFilter(2 * px + 1))


def shrink(mask, px):
    return mask.filter(ImageFilter.MinFilter(2 * px + 1))


def shading(im):
    """Shading mask (L, 255 = shaded), without the grey rims along line edges.

    Mid-grey pixels are shading or a line's soft edge. Opening the mask
    (shrink, then grow) by EDGE_PX drops the thin edge rims; the result is
    then grown back under the lines only, so it tucks beneath them (no gap
    when the two inks print slightly out of register) but never spills onto
    the paper next to a line."""
    soft = im.filter(ImageFilter.GaussianBlur(1))
    mid = soft.point(lambda v: 255 if LINE_THRESHOLD <= v < TONE_THRESHOLD else 0)
    line = soft.point(lambda v: 255 if v < LINE_THRESHOLD else 0)
    core = grow(shrink(mid, EDGE_PX), EDGE_PX)
    return ImageChops.darker(grow(core, 2 * EDGE_PX), ImageChops.lighter(core, line))


def paint(mask):
    """L mask (255 = paint) -> 1-bit image for potrace (black = paint)."""
    return mask.point(lambda v: 0 if v >= 128 else 255, mode='1')


def halftone_dots(im, lines, shade):
    """45° dot screen for the shading, as one path of circles (pixel space).
    Only the shading counts: line work and its soft edges read as paper."""
    px_per_mm = WORK_PX / HALFTONE_PRINT_WIDTH_MM    # printed mm, not nominal
    cell = HALFTONE_CELL_MM * px_per_mm
    min_r = MIN_DOT_MM * px_per_mm / 2
    only_shading = ImageChops.lighter(im, ImageChops.invert(shade))
    smooth = only_shading.filter(ImageFilter.GaussianBlur(cell / 2))
    covered = lines.convert('L').filter(ImageFilter.BoxBlur(cell / 2))
    w, h = im.size
    g, cov = smooth.load(), covered.load()
    half = math.hypot(w, h) / 2
    n = int(half / cell) + 1
    c45 = math.cos(math.pi / 4)
    dots = []
    for i in range(-n, n + 1):
        for j in range(-n, n + 1):
            x = w / 2 + (i - j) * cell * c45
            y = h / 2 + (i + j) * cell * c45
            if not (0 <= x < w and 0 <= y < h):
                continue
            if cov[int(x), int(y)] < 90:      # mostly solid line already
                continue
            dark = (PAPER - g[int(x), int(y)]) / (PAPER - 40)
            coverage = min(max(dark, 0), 1) * 0.7   # 0.7 ≈ dots almost touching
            r = cell * math.sqrt(coverage / math.pi)
            if r < min_r:
                continue
            dots.append(f'M{x - r:.1f} {y:.1f}a{r:.1f} {r:.1f} 0 1 0 {2 * r:.1f} 0'
                        f'a{r:.1f} {r:.1f} 0 1 0 {-2 * r:.1f} 0')
    return ''.join(dots)


def svg(name, w, h, layers, note):
    """layers: [(fill, d, transform or None)] painted in order."""
    body = '\n'.join(
        f'  <path fill="{fill}" fill-rule="nonzero"'
        + (f' transform="{tf}"' if tf else '') + f' d="{d}"/>'
        for fill, d, tf in layers)
    height_mm = NOMINAL_WIDTH_MM * h / w
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<!--
  {name}: {note}
  GENERATED by scripts/trace-portraits.py from the illustrator's drawing.
  Do not edit by hand; re-run the script. Credits: illustrations/portraits/README.md
-->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{NOMINAL_WIDTH_MM}mm" height="{height_mm:.1f}mm">
{body}
</svg>
"""


def build(src, out_dir):
    name = src.stem
    im = load(src)
    w, h = im.size
    lines = threshold(im.filter(ImageFilter.MedianFilter(3)), LINE_THRESHOLD)
    line_d, line_tf = trace(lines, turdsize=6, opttolerance=0.5)
    shade = shading(im)
    tone_d, tone_tf = trace(paint(shade), turdsize=40, opttolerance=0.8)
    dots = halftone_dots(im, lines, shade)

    files = {
        'lines.svg': [(INK, line_d, line_tf)],
        'halftone.svg': [(INK, dots, None), (INK, line_d, line_tf)],
    }
    notes = {
        'lines.svg': f'line work only, one ink ({INK}).',
        'halftone.svg': (f'line work + shading as a {HALFTONE_CELL_MM} mm dot screen when printed '
                         f'{HALFTONE_PRINT_WIDTH_MM} mm wide, one ink ({INK}).'),
    }
    for suffix, (line, tone, tee) in COLOURWAYS.items():
        key = f'tone{suffix}.svg'
        files[key] = [(tone, tone_d, tone_tf), (line, line_d, line_tf)]
        notes[key] = f'line work {line} + shading {tone}, for a {tee} tee (two inks).'

    for filename, layers in files.items():
        out = out_dir / name / filename
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(svg(name, w, h, layers, notes[filename]))
        print(f'  wrote {out}  ({out.stat().st_size // 1024} KB)')


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src_dir, out_dir = Path(sys.argv[1]).expanduser(), Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)
    sources = sorted(p for p in src_dir.iterdir() if p.suffix.lower() in ('.jpeg', '.jpg', '.png'))
    if not sources:
        sys.exit(f'no .jpeg/.jpg/.png drawings in {src_dir}')
    for src in sources:
        build(src, out_dir)


if __name__ == '__main__':
    main()
