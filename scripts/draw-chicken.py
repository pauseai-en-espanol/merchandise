#!/usr/bin/env python3
"""
Generate designs/ask-a-chicken/{es,en}.orange.front.svg.

A bold linocut-style hen (same drawing helpers and carving rules as the
shoggoth — scripts/draw-shoggoth.py) next to Geoffrey Hinton's line, set as
a justified stack whose last lines are the accent:

  "If you want to know what life's like when you're not the apex
   intelligence, ask a chicken."
   — Geoffrey Hinton, The Diary of a CEO, 16 June 2025 (see README)

Colour layers of the hen:
  body   INK on orange/white tees, PAPER on black (plain #111111 → builder)
  accent comb, wattle, beak — class="accent" (white on orange, orange else)
  white  the eye            constant
  iris   orange iris        constant (#FF9416)
  keep   pupil              constant ink (class="keep")

One-off generator (venv with pillow, numpy, scipy, fonttools + potrace):
    python3 scripts/draw-chicken.py
"""
import importlib.util
import math
from pathlib import Path

import numpy as np
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
DESIGN = ROOT / 'designs/ask-a-chicken'

_spec = importlib.util.spec_from_file_location(
    'shog', ROOT / 'scripts/draw-shoggoth.py')
shog = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(shog)

INK, WHITE = shog.INK, shog.PAPER
ACCENT = shog.PINK            # reuse a spare label index for the accent layer
KNOCK, BODY, EYE, IRIS, PUPIL = shog.KNOCK, shog.BODY, shog.WHITE, shog.IRIS, shog.INKFIX

F = 'font-family="Saira Condensed, Impact, sans-serif" font-weight="700"'

_font = TTFont(str(ROOT / 'brand/fonts/files/SairaCondensed-Bold.ttf'))
_cmap, _hmtx = _font.getBestCmap(), _font['hmtx']
_upm = _font['head'].unitsPerEm
CAP = _font['OS/2'].sCapHeight / _upm


def adv(s):
    return sum(_hmtx[_cmap[ord(c)]][0] for c in s) / _upm


# --- the hen (mm, canvas coordinates) ----------------------------------------

def hen():
    shog.img = Image.new('L', (shog.W * shog.PX, shog.H * shog.PX), KNOCK)
    shog.draw = ImageDraw.Draw(shog.img)
    shog.rng = np.random.default_rng(3)
    S = shog

    # tail: a fan of broad, arched feathers, back to front
    base = np.array([38.0, 112.0])
    for tip, w0, bend in [((12, 100), 13, 7), ((14, 85), 14, 7),
                          ((22, 75), 14, 6), ((33, 71), 12, 5)]:
        tip = np.array(tip, float)
        d = tip - base
        n = np.array([d[1], -d[0]]) / np.linalg.norm(d)      # bulge up/right
        mid = base + 0.55 * d + n * bend
        pts = S.spline([base, mid, tip], n=30)
        w = S.taper(len(pts), w0, 3.0, 1.4)
        S.ribbon(pts, w + 2 * 0.9, KNOCK)
        S.ribbon(pts, w, BODY)
        q = slice(4, -8)                                      # carved quill
        S.ribbon(pts[q], np.full(len(pts[q]), S.CARVE), KNOCK)

    # legs + feet (behind the body)
    for hip, knee, foot in [((47, 132), (45, 145), (43, 158)),
                            ((58, 132), (60, 145), (61, 158))]:
        S.ribbon(S.spline([hip, knee, foot], n=12), 2.8, BODY)
        for dx, dy in [(-5.5, 0.6), (5.5, 0.2), (1.8, 1.2)]:
            S.ribbon(np.array([foot, (foot[0] + dx, foot[1] + dy)]), 1.7, BODY)

    # body
    body = S.blob((52, 118), 25, 19, [(.03, 2, 1.0), (.02, 3, .3)], rot=-0.22)
    S.fill_outline(body, BODY, gap=1.0)
    # breast feathers: rows of small carved scallops
    for row, (y0, xs) in enumerate([(106, range(64, 76, 5)), (113, range(60, 76, 5)),
                                    (120, range(58, 74, 5)), (127, range(56, 70, 5))]):
        for x in xs:
            x += 2.5 * (row % 2)
            th = np.linspace(0.15 * math.pi, 0.85 * math.pi, 10)
            arc = np.stack([x + 2.3 * np.cos(th), y0 + 1.6 * np.sin(th)], 1)
            S.ribbon(arc, S.CARVE, KNOCK)

    # wing: blob with carved feather tips
    wing_c = (45, 116)
    wing = S.blob(wing_c, 16, 10.5, [(.03, 3, 2.0)], rot=-0.28)
    S.fill_outline(wing, BODY, gap=1.1)
    for k in range(5):
        a = -0.28
        x0 = wing_c[0] - 12 + k * 5.2
        y0 = wing_c[1] + 5.5 - k * 1.6
        seg = np.array([(x0, y0 - 5), (x0 + 1.8, y0 + 1.5)])
        S.ribbon(S.spline(seg, n=6), S.taper(7, S.CARVE * 1.2, S.THIN), KNOCK)

    # comb (accent) — drawn before the head so the head overlaps its base
    for c, r in [((68.5, 76.5), 3.4), ((73, 74.2), 3.9), ((77.5, 76.2), 3.2)]:
        S.disc(c, r + 0.9, KNOCK)
        S.disc(c, r, ACCENT)

    # neck + head
    neck = S.spline([(64, 108), (69, 97), (73, 88)], n=16)
    S.ribbon(neck, S.taper(len(neck), 17, 13), BODY)
    S.disc((74, 85), 9.2, BODY)
    # neck feathers: carved hackles
    for k in range(4):
        x = 67 + k * 2.6
        S.ribbon(S.spline([(x, 95), (x - 1.2, 101.5)], n=6),
                 S.taper(7, S.CARVE * 1.1, S.THIN), KNOCK)

    # beak (accent) + wattle (accent)
    beak = [(81.5, 81.6), (91.5, 85.3), (81.5, 88.2)]
    S.poly(S.spline(beak + [(80.5, 85)], n=6, closed=True), ACCENT)
    S.ribbon(np.array([(82.5, 85.2), (89, 85.4)]), S.THIN, KNOCK)   # mouth line
    for c, r in [((80.2, 92.5), 2.6), ((79.4, 96.3), 2.1)]:
        S.disc(c, r + 0.8, KNOCK)
        S.disc(c, r, ACCENT)

    # eye — orange iris, like a real hen's
    S.eye((76, 83.2), 2.5, gaze=(0.5, 0.0), ring=0.6)

    # ground
    S.ribbon(np.array([(26, 160.5), (80, 160.5)]), 1.1, BODY)
    return np.array(shog.img)


def emit(lab):
    fills = {BODY: ('hen-body', f'fill="{INK}"'),
             ACCENT: ('hen-accent', f'class="accent" fill="{WHITE}"'),
             EYE: ('hen-eye', f'fill="{WHITE}"'),
             IRIS: ('hen-iris', f'fill="{shog.ORANGE}"'),
             PUPIL: ('hen-pupil', f'class="keep" fill="{INK}"')}
    stack = [BODY, ACCENT, EYE, IRIS, PUPIL]
    out = ['  <g id="hen" transform="scale(0.05)">']
    for i, k in enumerate(stack):
        own = lab == k
        if not own.any():
            continue
        above = np.isin(lab, stack[i + 1:])
        m = own | (ndimage.binary_dilation(own, iterations=3) & above)
        tr, d = shog.trace(m)
        gid, attrs = fills[k]
        out.append(f'    <g id="{gid}" {attrs} stroke="none" transform="{tr}"><path d="{d}"/></g>')
    out.append('  </g>')
    return '\n'.join(out)


# --- text -------------------------------------------------------------------

TXT = {
    'es': dict(
        title='Si quieres saber cómo es la vida cuando no eres la inteligencia '
              'dominante, pregúntale a un pollo. — Geoffrey Hinton',
        setup=['«SI QUIERES SABER', 'CÓMO ES LA VIDA', 'CUANDO NO ERES LA',
               'INTELIGENCIA DOMINANTE,'],
        payoff=['PREGÚNTALE', 'A UN POLLO.»'],
        attr='GEOFFREY HINTON',
        sub='Premio Nobel de Física 2024 · entrevista en «The Diary of a CEO», 16 de junio de 2025',
        orig=None),
    'en': dict(
        title='If you want to know what life’s like when you’re not the apex '
              'intelligence, ask a chicken. — Geoffrey Hinton',
        setup=['“IF YOU WANT TO KNOW', 'WHAT LIFE’S LIKE WHEN', 'YOU’RE NOT THE APEX',
               'INTELLIGENCE,'],
        payoff=['ASK A', 'CHICKEN.”'],
        attr='GEOFFREY HINTON',
        sub='2024 Nobel Prize in Physics · interview on “The Diary of a CEO”, 16 June 2025',
        orig=None),
}

COL_X, COL_W = 98, 88          # right text column
TOP, BOTTOM = 72, 158          # stack spans the hen's height
SETUP_MAX = 13.5               # setup lines never grow past this size


def stack(t):
    """Justified column: payoff lines always fill COL_W; setup lines fill it
    unless that would make them larger than SETUP_MAX (then left-aligned)."""
    rows = [(s, False) for s in t['setup']] + [(s, True) for s in t['payoff']]

    def layout(k):
        y, out = TOP, []
        for i, (s, acc) in enumerate(rows):
            sz = COL_W / adv(s) * k
            if not acc:
                sz = min(sz, SETUP_MAX * k)
            if i and any(c in s for c in 'ÁÉÍÓÚ'):
                y += sz * 0.16
            y += sz * CAP
            out.append((s, acc, sz, y))
            y += 2.4 + (4.0 * k if i == len(t['setup']) - 1 else 0)
        return out, y - 2.4

    k = 1.0
    while layout(k)[1] > BOTTOM:
        k -= 0.005
    return layout(k)[0]


def main():
    lab = hen()
    art = emit(lab)
    for lang, t in TXT.items():
        logo_src = (ROOT / 'designs/shoggoth-friendly-face' / f'{lang}.orange.front.svg').read_text()
        a = logo_src.index('  <svg x=')
        logo = logo_src[a:logo_src.index('</svg>', a) + 6]
        lines = []
        for s, acc, sz, y in stack(t):
            fill = 'class="accent" fill="#FFFFFF"' if acc else f'fill="{INK}"'
            lines.append(f'    <text x="{COL_X}" y="{y:.2f}" font-size="{sz:.2f}" {fill}>{s}</text>')
        orig = (f'\n  <text id="original" x="100" y="191.5" {F} font-style="italic" '
                f'font-size="3.2" fill="{INK}" text-anchor="middle">{t["orig"]}</text>'
                if t['orig'] else '')
        svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!--
  Design: ask-a-chicken (chest, {'Spanish' if lang == 'es' else 'English'})
  Voice lane: B (a verified quote from a Nobel laureate)
  GENERATED by scripts/draw-chicken.py — edit there, not here.

  Layout (200 × 200 mm canvas):
    y=15..63    logo
    y=72..162   the hen (left, x 11..92) | justified quote column (right,
                x {COL_X}..{COL_X + COL_W}); the payoff lines are the accent
    y=172..181  attribution
-->
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 200 200"
     width="200mm" height="200mm"
     role="img"
     aria-label="{t['title']}">
  <title>{t['title']}</title>

{logo}

{art}

  <g id="quote" {F}>
{chr(10).join(lines)}
  </g>

  <text id="attribution" x="100" y="174" {F} font-size="8" fill="{INK}" text-anchor="middle">{t['attr']}</text>
  <text id="attribution-sub" x="100" y="180.5" {F} font-style="italic" font-size="4.2" fill="{INK}" text-anchor="middle">{t['sub']}</text>{orig}
</svg>
'''
        DESIGN.mkdir(exist_ok=True)
        (DESIGN / f'{lang}.orange.front.svg').write_text(svg)
        print(f'  wrote {lang}.orange.front.svg')


if __name__ == '__main__':
    main()
