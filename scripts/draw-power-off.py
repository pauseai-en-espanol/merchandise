#!/usr/bin/env python3
"""
Draw the green shoggoth tentacle for designs/what-if-it-wont-shut-down/ and
splice it into {es,en}.orange.front.svg.

The tentacle coils around the bar of the power symbol (⏻), so it is drawn in
two passes that sandwich the (hand-authored, vector) symbol:

    <g id="tentacle-back">   stretches that pass BEHIND the bar
    <g id="power">           the symbol itself (in the canonical SVG)
    <g id="tentacle-front">  stretches that pass IN FRONT

Front/back is decided by direction of travel: the coil is drawn so that
every right→left stretch crosses in front of the bar and every left→right
stretch passes behind it.

Reuses the drawing helpers and palette of scripts/draw-shoggoth.py (same
look as the shoggoth-friendly-face creature: deep-green body, carved groove,
white/orange/ink eyes). One-off art tool, not a pipeline stage.

    brew install potrace; pip install pillow numpy scipy   # in a venv
    python3 scripts/draw-power-off.py [--preview out.png]
"""
import argparse
import importlib.util
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
DESIGN = ROOT / 'designs/what-if-it-wont-shut-down'

_spec = importlib.util.spec_from_file_location(
    'shog', ROOT / 'scripts/draw-shoggoth.py')
shog = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(shog)

# Tentacle centreline (mm, canvas coordinates). Enters from the lower right,
# crosses the ring, then coils twice around the bar (x = 100, y 74..112).
CTRL = [(184, 146), (166, 142), (146, 134), (128, 122), (114, 112),
        (86, 106), (114, 97), (86, 90), (110, 82), (104, 74), (95, 77)]
W0, W1 = 16.0, 4.0


def new_canvas():
    shog.img = Image.new('L', (shog.W * shog.PX, shog.H * shog.PX), shog.KNOCK)
    shog.draw = ImageDraw.Draw(shog.img)


def runs(mask):
    """Split a boolean array into (start, end) index runs of True."""
    out, start = [], None
    for i, m in enumerate(list(mask) + [False]):
        if m and start is None:
            start = i
        elif not m and start is not None:
            out.append((start, i))
            start = None
    return out


def paint(pts, w, front):
    """Paint the stretches of the tentacle that belong to one pass."""
    dx = np.gradient(pts[:, 0])
    sel = dx <= 0 if front else dx > 0
    # the first stretch (lower right → ring) is front regardless of wiggles
    sel[:int(len(pts) * 0.3)] = front
    for a, b in runs(sel):
        a0, b0 = max(a - 1, 0), min(b + 1, len(pts))
        seg, ws = pts[a0:b0], w[a0:b0]
        if len(seg) < 2:
            continue
        shog.ribbon(seg, ws + 2 * shog.GAP, shog.KNOCK)
        shog.ribbon(seg, ws, shog.BODY)
        if front and len(seg) > 12:
            nrm = shog.normals(seg)
            g = seg + nrm * (ws[:, None] * 0.24)
            gw = np.minimum(shog.CARVE, ws * 0.12)
            keep = gw >= shog.THIN
            k = np.where(keep)[0]
            if len(k) > 6:
                shog.ribbon(g[k[2]:k[-2]], gw[k[2]:k[-2]], shog.KNOCK)


def draw_pass(front):
    new_canvas()
    pts = shog.spline(CTRL, n=40)
    w = shog.taper(len(pts), W0, W1, 0.7)
    paint(pts, w, front)
    if front:
        for t, r in [(0.04, 3.4), (0.12, 2.5), (0.2, 1.9), (0.27, 1.5),
                     (0.52, 1.3)]:
            i = int(t * (len(pts) - 1))
            shog.eye(tuple(pts[i]), r)
    return np.array(shog.img)


def emit(lab, gid):
    lines = [f'  <g id="{gid}" transform="scale({1 / shog.PX:.6g})">']
    for i, k in enumerate(shog.STACK):
        own = lab == k
        if not own.any():
            continue
        above = np.isin(lab, shog.STACK[i + 1:])
        m = own | (ndimage.binary_dilation(own, iterations=3) & above)
        tr, d = shog.trace(m)
        keep = ' class="keep"' if k == shog.INKFIX else ''
        lines.append(f'    <g{keep} fill="{shog.FILLS[k]}" stroke="none" '
                     f'transform="{tr}"><path d="{d}"/></g>')
    lines.append('  </g>')
    return '\n'.join(lines)


def splice(svg, gid, block):
    pat = re.compile(r'  <g id="' + gid + r'".*?\n  </g>', re.DOTALL)
    assert pat.search(svg), gid
    return pat.sub(lambda _: block, svg, count=1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--preview')
    args = ap.parse_args()
    back, front = draw_pass(False), draw_pass(True)
    if args.preview:
        lab = np.where(front != shog.KNOCK, front, back)
        shog.preview(lab, args.preview)
        return
    for lang in ('es', 'en'):
        p = DESIGN / f'{lang}.orange.front.svg'
        s = p.read_text()
        s = splice(s, 'tentacle-back', emit(back, 'tentacle-back'))
        s = splice(s, 'tentacle-front', emit(front, 'tentacle-front'))
        p.write_text(s)
        print(f'  wrote {p.relative_to(ROOT)}  ({p.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
