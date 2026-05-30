#!/usr/bin/env python3
"""
Derive the GREEN body fill + white EYE discs for the shoggoth and splice them
into designs/shoggoth-cara-amable/{es,en}.orange.front.svg.

This is a ONE-OFF asset generator, NOT part of the recurring build pipeline
(like scripts/trace-shoggoth.py). Its output — a single <g id="shoggoth-fill">
group holding <g id="shoggoth-body"> (deep green silhouette) and
<g id="shoggoth-eyes"> (paper-white eye discs) — is committed into the two
orange canonicals, the source of truth. You only need to re-run this if you
re-trace the creature (scripts/trace-shoggoth.py) or want to retune the fill /
eyes; after running it, run scripts/build-shoggoth-cara-amable.py (and
./scripts/build-all.sh) to regenerate the white/black tee variants + prints +
mockups.

WHY THIS EXISTS
  The committed creature is Anna Husfeldt's loose black LINE drawing — open,
  tangled contours with no closed silhouette to flood-fill. To colour it we
  (1) rasterise ONLY the <g id="shoggoth-ink"> linework, (2) build a silhouette
  from local ink DENSITY (gaussian blur + threshold) so the fill hugs the
  creature without needing closed outlines and without spilling into the
  background between splayed tentacles, and (3) detect the eyes as small,
  round, enclosed white cells (sealing hairline gaps in their outlines first)
  and stamp them back as white discs on top of the fill so they read white.
  The pink mask and yellow smiley are excluded from eye detection so their
  faces are left untouched.

LAYERING (document order, so the fill sits behind the creature)
  logo … <g id="shoggoth-fill"> … <g id="art"> (mask, smiley, ink) … text
  Inside shoggoth-fill: body first, eyes second (eyes above the green).

PER-TEE (handled later by scripts/build-shoggoth-cara-amable.py)
  bodyGreen (#1F5C38) and the white eyes are CONSTANT on every tee — they are
  neither #111111 nor class="accent", so the builder's ink->paper / accent
  swaps never touch them. Only the linework flips ink<->paper per tee.

GEOMETRY (how the traced pixels land exactly on the creature)
  We rasterise the creature inside the design's own square 0 0 200 200 viewBox
  at N x N px (uniform N/200 px/mm, top-left origin — qlmanage renders a square
  viewBox without stretching). potrace on an N-tall bitmap emits
  transform="translate(0,N) scale(0.1,-0.1)", which renders the bitmap upright
  at 1 user-unit = 1 px. Wrapping that in scale(200/N) maps px -> mm, i.e. back
  onto the design canvas — so the green drops exactly under the linework.

Requires: macOS `qlmanage` (already used by build-all.sh), `potrace` on PATH,
and pillow + numpy + scipy (a venv; NOT pipeline deps — the committed fragment
is plain vector). Run from the repo root:
    python3 scripts/trace-shoggoth-body.py                 # auto: ink-density
    python3 scripts/trace-shoggoth-body.py --mask paint.png  # hand-painted body

MANUAL MODE (--mask): pass a PNG painted over mockups/renders/shoggoth-cara-
amable/_paint-template.png (the clean line-art coloring page, in the design's
square 0 0 200 200 frame). Paint the body region in any BRIGHT colour; the
script takes every coloured (non-black/white) pixel as the silhouette, so you
can scribble over the lines and eyes freely — the linework redraws on top and
the eyes are re-punched. Don't crop the canvas (any uniform scale is fine; it's
resampled to the working grid). Everything else (eye detection, per-tee) is
identical to auto mode.
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
DESIGN = ROOT / "designs/shoggoth-cara-amable"
TOKENS = json.loads((ROOT / "brand/tokens.json").read_text())["illustrationColors"]

N = 6000                      # render size (px). 200 mm canvas -> 30 px/mm
GREEN = TOKENS["bodyGreen"]["hex"]
PINK = TOKENS["maskPink"]["hex"]
YELLOW = TOKENS["smileyYellow"]["hex"]
WHITE = "#FFFFFF"

# silhouette (ink-density) params, tuned at 30 px/mm
SIG = 34                      # gaussian blur sigma (px) for ink density
THRESH = 0.15                 # density cutoff
CLOSE = 8                     # morphological close radius (px)
# eye params
SEAL = 5                      # close ink this much to seal hairline eye gaps
EYE_MIN, EYE_MAX = 160, 12000  # sclera area bounds (px)
EYE_ROUND = 0.50             # 1.0 = perfect disc; rejects elongated cells
EYE_SHRINK = 0.92            # white-disc radius factor (stay inside the outline)

# optional hand-painted silhouette: `--mask path.png`
MASK_PATH = None
if "--mask" in sys.argv:
    MASK_PATH = sys.argv[sys.argv.index("--mask") + 1]


def hex2rgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)])


def disk(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return x * x + y * y <= r * r


def load_paint_mask(path):
    """A hand-painted silhouette: every coloured (non-B/W) pixel = body."""
    a = np.asarray(Image.open(path).convert("RGB").resize((N, N), Image.NEAREST)
                   ).astype(np.int16)
    chroma = a.max(2) - a.min(2)               # 0 for the B/W template, high for paint
    sil = chroma > 40
    sil = ndimage.binary_fill_holes(ndimage.binary_closing(sil, disk(4)))
    lbl, n = ndimage.label(sil)                # drop stray speckles
    if n:
        sizes = ndimage.sum(np.ones_like(lbl), lbl, range(1, n + 1))
        sil = np.isin(lbl, [i + 1 for i, s in enumerate(sizes) if s >= 2000])
    if not sil.any():
        sys.exit(f"no coloured paint found in {path} — paint the body in a "
                 f"bright colour and export without cropping the canvas")
    return sil


def render(inner_svg, outpng):
    """Rasterise a creature layer inside the design's square viewBox."""
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" '
           f'width="{N}" height="{N}"><rect width="200" height="200" '
           f'fill="#fff"/>\n{inner_svg}\n</svg>\n')
    src = outpng.with_suffix(".svg")
    src.write_text(svg)
    subprocess.run(["qlmanage", "-t", "-s", str(N), "-o", str(outpng.parent),
                    str(src)], check=True, stdout=subprocess.DEVNULL,
                   stderr=subprocess.DEVNULL)
    produced = outpng.parent / (src.name + ".png")
    if not produced.exists():
        sys.exit(f"qlmanage produced no PNG for {src.name} — is it on PATH?")
    return Image.open(produced)


def trace(mask, pbm):
    """potrace a boolean mask -> (transform, inner paths)."""
    Image.fromarray(np.where(mask, 0, 255).astype("uint8")).convert("1").save(pbm)
    svg = pbm.with_suffix(".svg")
    subprocess.run(["potrace", str(pbm), "-b", "svg", "-t", "10", "-a", "1.0",
                    "-O", "0.2", "-o", str(svg)], check=True)
    m = re.search(r'<g\s+transform="([^"]*)"[^>]*>(.*?)</g>', svg.read_text(),
                  re.DOTALL)
    return m.group(1), m.group(2).strip()


def build_fragment(tmp):
    tmp = Path(tmp)
    src = (DESIGN / "es.orange.front.svg").read_text()
    art_open = re.search(r'<g id="art"[^>]*>', src).group(0)
    ink_grp = re.search(r'<g id="shoggoth-ink".*?</g>', src, re.DOTALL).group(0)
    full_grp = re.search(r'<g id="shoggoth">.*?\n</g>', src, re.DOTALL).group(0)

    inkL = np.asarray(render(f"{art_open}\n{ink_grp}\n</g>",
                             tmp / "ink").convert("L"))
    full = np.asarray(render(f"{art_open}\n{full_grp}\n</g>",
                             tmp / "full").convert("RGB")).astype(np.int16)

    def near(hexc, tol):
        return np.sqrt(((full - hex2rgb(hexc)) ** 2).sum(2)) < tol
    pink, yellow = near(PINK, 70), near(YELLOW, 80)
    ink = (inkL < 128) | (full.sum(2) < 330)

    # --- silhouette: hand-painted mask, or auto from ink density --------
    if MASK_PATH:
        sil = load_paint_mask(MASK_PATH)
        print(f"  silhouette from hand-painted mask {MASK_PATH}")
    else:
        dens = ndimage.gaussian_filter(ink.astype(np.float32), SIG)
        sil = ndimage.binary_fill_holes(
            ndimage.binary_closing(dens > THRESH, disk(CLOSE)))
        lbl, n = ndimage.label(sil)
        if n > 1:                                 # keep the largest blob only
            sizes = ndimage.sum(np.ones_like(lbl), lbl, range(1, n + 1))
            sil = lbl == (int(np.argmax(sizes)) + 1)

    # --- eyes: round, enclosed white cells inside the body -------------
    sealed = ndimage.binary_closing(ink, disk(SEAL))
    wl, wn = ndimage.label(~sealed)
    border = (set(wl[0, :]) | set(wl[-1, :]) | set(wl[:, 0]) | set(wl[:, -1]))
    border.discard(0)
    eye = np.zeros_like(ink)
    yy, xx = np.ogrid[:N, :N]
    n_eyes = 0
    for i in range(1, wn + 1):
        if i in border:
            continue
        comp = wl == i
        area = int(comp.sum())
        if area < EYE_MIN or area > EYE_MAX:
            continue
        filled = ndimage.binary_fill_holes(comp)
        fa = int(filled.sum())
        ys, xs = np.where(filled)
        cy, cx = ys.mean(), xs.mean()
        rmax = float(np.sqrt(((xs - cx) ** 2 + (ys - cy) ** 2).max()))
        if fa / (np.pi * rmax * rmax + 1e-9) < EYE_ROUND:
            continue
        ic, jc = int(cy), int(cx)
        if not sil[ic, jc] or pink[ic, jc] or yellow[ic, jc]:
            continue                              # outside body, or on a face
        eye |= (xx - cx) ** 2 + (yy - cy) ** 2 <= (rmax * EYE_SHRINK) ** 2
        n_eyes += 1

    body = sil & ~eye                             # punch the eyes out of green
    t_body, p_body = trace(body, tmp / "body.pbm")
    t_eye, p_eye = trace(eye, tmp / "eyes.pbm")
    sc = 200.0 / N
    frag = (f'  <g id="shoggoth-fill" transform="scale({sc:.8f})">\n'
            f'  <g id="shoggoth-body" fill="{GREEN}" stroke="none" '
            f'transform="{t_body}">\n{p_body}\n  </g>\n'
            f'  <g id="shoggoth-eyes" fill="{WHITE}" stroke="none" '
            f'transform="{t_eye}">\n{p_eye}\n  </g>\n'
            f'  </g>\n')
    print(f"  silhouette {100 * sil.sum() / sil.size:.1f}% of canvas, "
          f"{n_eyes} eyes, fragment {len(frag)} bytes")
    return frag


def splice(path, frag):
    s = path.read_text()
    s = re.sub(r'  <g id="shoggoth-fill".*?(?=  <g id="art")', "", s,
               flags=re.DOTALL)                   # idempotent: drop old fill
    s = s.replace('  <g id="art"', frag + '  <g id="art"', 1)
    path.write_text(s)
    print(f"  spliced into {path.relative_to(ROOT)}")


def main():
    with tempfile.TemporaryDirectory() as tmp:
        frag = build_fragment(tmp)
    for name in ("es.orange.front.svg", "en.orange.front.svg"):
        splice(DESIGN / name, frag)
    print("Done. Now run scripts/build-shoggoth-cara-amable.py (or build-all.sh).")


if __name__ == "__main__":
    main()
