#!/usr/bin/env python3
"""
Regenerate the vector shoggoth art for designs/shoggoth-cara-amable/ from
Anna Husfeldt's line-art original.

This is a ONE-OFF asset generator, NOT part of the recurring build pipeline.
Its output (the three <g id="shoggoth-*"> layers) is already inlined into
designs/shoggoth-cara-amable/es.orange.front.svg, the hand-maintained source
of truth. You only need this script to re-trace the art (different line
threshold, despeckle, cleaner fills, etc.); after running it, splice the
emitted fragment back in between <g id="shoggoth"> … </g>, then run
scripts/build-shoggoth-cara-amable.py and ./scripts/build-all.sh.

Source image (NOT committed — pure vector is the repo's source of truth):
  "Putting Smileys on a Shoggoth", drawn by Anna Husfeldt, CC-BY-SA 3.0
  https://thorehusfeldt.com/2023/03/02/reinforcement-learning-using-human-feedback-is-putting-smileys-on-a-shoggoth/
  direct file: https://thorehusfeldt.com/wp-content/uploads/2023/03/fqyb3rlwaae45xe.jpeg
  (the same drawing is mirrored on various Substack reposts of the meme.)

FAITHFUL 3-LAYER trace — reproduces Anna's drawing as a black line drawing
with exactly two spot-colour fills, just like the original on white paper:

  shoggoth-mask    PINK   the supervised-fine-tuning face — a SOLID, cleaned
                          fill (close + fill-holes + keep-largest), constant
                          colour on every tee.
  shoggoth-smiley  YELLOW the RLHF smiley disc — a cleaned solid fill,
                          constant colour on every tee.
  shoggoth-ink     BLACK  EVERY dark line of the drawing (creature, the
                          grimacing mask face *and* its features, the smiley's
                          eyes/smile) via a LUMINANCE threshold. Drawn ON TOP
                          of the two fills. This is the per-tee BODY
                          (#111111, swaps to paper #FFFFFF on the black tee).

Layer order in the fragment is mask, smiley, ink — so the black line features
sit on top of the pink/yellow fills (pink face + black grimace = the original
face; yellow disc + black smile = the original smiley).

Why luminance for the line and channel masks only for the fills: the mask's
grimace is mostly black LINES over a pink fill; a per-channel "ink" separation
loses those faint lines. A luminance threshold keeps every dark line while the
LIGHT pink/yellow fills fall above it and never pollute the linework. `white`
is BRIGHT-AND-NEUTRAL (high value, low chroma) so the saturated pink/yellow
are NOT mistaken for paper. The BLUE handwritten English labels are excluded
explicitly (re-authored as live text in the design).

The source is resized to height 671 px so potrace emits the SAME
`transform="translate(0,671) scale(0.1,-0.1)"` the canonical <g id="art">
wrapper is positioned for — a drop-in replacement that keeps the creature's
size and position. NEVER erode the linework (median/open destroy thin lines);
a connected-component pass despeckles by area and a 1-px grow keeps lines
print-safe (≥ ~0.4 mm at tee scale).

Requires: pillow, numpy, scipy, and `potrace` on PATH (`brew install potrace`,
`pip install pillow numpy scipy` in a venv — NOT pipeline deps; the committed
fragment is plain vector).

Usage:
    python3 scripts/trace-shoggoth.py <src.jpeg> <outdir> [luma=165] [pink_close=9]
The committed art was produced with the defaults.
"""
import subprocess
import sys
import re
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from scipy import ndimage

src, outdir = sys.argv[1], sys.argv[2]
LUMA = int(sys.argv[3]) if len(sys.argv) > 3 else 165       # dark-line cutoff
PINK_CLOSE = int(sys.argv[4]) if len(sys.argv) > 4 else 9   # merge the face fill
H_B = 671   # bitmap height — matches the canonical <g id="art"> placement

# Illustration colours (constant on every tee; documented in brand/tokens.json
# under illustrationColors as non-brand, derived from Anna Husfeldt's drawing).
MASK = "#EC85C9"     # supervised-fine-tuning mask face
YELLOW = "#FBD24A"   # RLHF smiley disc
INK = "#111111"      # all linework (per-tee body)

im = Image.open(src).convert("RGB")
W_B = round(H_B * im.width / im.height)          # preserve aspect (~1201×671)
im = im.resize((W_B, H_B), Image.LANCZOS)
a = np.asarray(im).astype(np.int16)
R, G, B = a[..., 0], a[..., 1], a[..., 2]
mx = a.max(2)
chroma = mx - a.min(2)
luma = 0.299 * R + 0.587 * G + 0.114 * B
white = (mx > 215) & (chroma < 25)               # bright AND neutral (not fills)
blue = (~white) & (B > R + 22) & (B > G + 6) & (B > 80)
yellow = (~white) & (R > 150) & (G > 120) & (R > B + 28) & (G > B + 18)
pink = (~white) & (R > 135) & (R > G + 8) & (B > G - 18) & ~yellow & ~blue
line = (luma < LUMA) & ~blue


def to_img(mask):
    return Image.fromarray(np.where(mask, 0, 255).astype("uint8"))


def grow(img, px):      # dilate the black target
    for _ in range(px):
        img = img.filter(ImageFilter.MinFilter(3))
    return img


def shrink(img, px):    # erode the black target
    for _ in range(px):
        img = img.filter(ImageFilter.MaxFilter(3))
    return img


def close(img, px):     # dilate then erode: connect fragments / fill gaps
    return shrink(grow(img, px), px)


def fill_holes(img):    # flood outside-white; remaining interior white -> black
    f = img.copy()
    ImageDraw.floodfill(f, (0, 0), 128)
    return Image.fromarray(np.where(np.asarray(f) == 128, 255, 0).astype("uint8"))


def keep_large(mask, minsize):
    lbl, n = ndimage.label(mask)
    if not n:
        return mask
    sizes = ndimage.sum(mask, lbl, range(1, n + 1))
    return np.concatenate(([False], sizes >= minsize))[lbl]


# --- build layers -----------------------------------------------------
# PINK: drop specks, close across the black grimace lines, fill the interior,
# keep only the big component(s) -> one solid face-shaped patch.
pink_img = close(to_img(keep_large(pink, 30)), PINK_CLOSE)
pink_img = fill_holes(pink_img)
pink_img = to_img(keep_large(np.asarray(pink_img) == 0, 400))
# YELLOW: drop specks, close, fill -> a solid disc.
yellow_img = fill_holes(close(to_img(keep_large(yellow, 15)), 4))
# INK: despeckle, 1-px grow for print safety. NO erosion.
line_img = grow(to_img(keep_large(line, 6)), 1)


def trace(img, name):
    pbm = f"{outdir}/layer_{name}.pbm"
    svg = f"{outdir}/layer_{name}.svg"
    img.convert("1").save(pbm)
    subprocess.run(["potrace", pbm, "-b", "svg", "-t", "6",
                    "-a", "1.0", "-O", "0.2", "-o", svg], check=True)
    m = re.search(r'<g\s+transform="([^"]*)"[^>]*>(.*?)</g>', open(svg).read(),
                  re.DOTALL)
    return m.group(1), m.group(2).strip()   # shared transform, inner paths


# mask + smiley fills first (behind), ink last (on top)
specs = [("shoggoth-mask", pink_img, MASK),
         ("shoggoth-smiley", yellow_img, YELLOW),
         ("shoggoth-ink", line_img, INK)]
groups = []
for gid, img, fill in specs:
    transform, paths = trace(img, gid)
    groups.append(f'  <g id="{gid}" fill="{fill}" stroke="none" '
                  f'transform="{transform}">\n{paths}\n  </g>')

fragment = "\n".join(groups) + "\n"
open(f"{outdir}/shoggoth-fragment.svg", "w").write(fragment)

# standalone preview (white paper) to eyeball the vector result
open(f"{outdir}/shoggoth-art.svg", "w").write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W_B} {H_B}" '
    f'width="{W_B}" height="{H_B}"><rect width="{W_B}" height="{H_B}" '
    f'fill="#fff"/>\n{fragment}</svg>\n')

print("bitmap %dx%d  transform %s" % (W_B, H_B, transform))
print("layers: mask=%d yellow=%d ink=%d px"
      % ((np.asarray(pink_img) == 0).sum(),
         (np.asarray(yellow_img) == 0).sum(),
         (np.asarray(line_img) == 0).sum()))
print("wrote", f"{outdir}/shoggoth-fragment.svg", f"({len(fragment)} bytes)")
