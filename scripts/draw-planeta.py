#!/usr/bin/env python3
"""
Generate designs/el-ultimo-jardin/{es,en}.orange.front.svg.

A small planet entirely tiled with solar panels and data-centre blocks,
except one last patch of ground on top where a single person stands next to
a single tree. Under it, Ilya Sutskever's line (verified, see README):

  "I think it's pretty likely the entire surface of the earth will be
   covered with solar panels and data centres."

Pure vector (no tracing); fontTools only to size the stressed words: the sphere is an orthographic
projection of a latitude/longitude grid, viewed from slightly above.

  - each grid cell is either a SOLAR PANEL (split into 2 × 3 cells with real
    gaps, so the tee shows through) or a DATA CENTRE (solid block with a row
    of status LEDs);
  - panels and blocks are body ink (#111111): ink on orange/white tees,
    paper on black;
  - the last patch of ground and the LEDs are class="accent" (white on the
    orange tee, orange on white/black);
  - person + tree are body ink.

    python3 scripts/draw-planeta.py
"""
import math
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DESIGN = ROOT / 'designs/el-ultimo-jardin'

INK, WHITE = '#111111', '#FFFFFF'
F = 'font-family="Saira Condensed, Impact, sans-serif" font-weight="700"'

CX, CY, R = 57.0, 128.0, 40.0     # planet on the left; text wraps on the right
TILT = math.radians(24)          # we look at the planet from slightly above
NLAT, NLON = 10, 18
CAP_LAT = math.radians(64)       # everything above this latitude is the garden
DC_SHARE = 0.17                  # share of cells that are data centres
SEED = 11


def proj(lat, lon):
    x = math.cos(lat) * math.sin(lon)
    y = math.sin(lat)
    z = math.cos(lat) * math.cos(lon)
    y2 = y * math.cos(TILT) - z * math.sin(TILT)
    z2 = y * math.sin(TILT) + z * math.cos(TILT)
    return CX + R * x, CY - R * y2, z2


def quad(la0, la1, lo0, lo1):
    return [proj(la0, lo0), proj(la0, lo1), proj(la1, lo1), proj(la1, lo0)]


def path(pts):
    return 'M ' + ' L '.join(f'{x:.2f} {y:.2f}' for x, y, *_ in pts) + ' Z'


def planet():
    rnd = random.Random(SEED)
    cells = []
    dlat = (CAP_LAT + math.pi / 2) / NLAT
    for i in range(NLAT):
        la0 = -math.pi / 2 + i * dlat
        la1 = la0 + dlat
        for j in range(NLON):
            lo0 = -math.pi + 2 * math.pi * j / NLON
            lo1 = lo0 + 2 * math.pi / NLON
            zc = proj((la0 + la1) / 2, (lo0 + lo1) / 2)[2]
            if zc < 0.08:                         # back side / extreme limb
                continue
            cells.append((zc, la0, la1, lo0, lo1,
                          'dc' if rnd.random() < DC_SHARE else 'pv'))
    cells.sort()

    body, leds = [], []
    g = 0.10                                     # gap between cells (param)
    for zc, la0, la1, lo0, lo1, kind in cells:
        a0 = la0 + g * (la1 - la0); a1 = la1 - g * (la1 - la0)
        b0 = lo0 + g * (lo1 - lo0); b1 = lo1 - g * (lo1 - lo0)
        if kind == 'pv':
            # 2 rows × 3 columns of panel cells, with real gaps between them
            for r in range(2):
                for c in range(3):
                    s = 0.06
                    ra0 = a0 + (a1 - a0) * (r / 2 + (s if r else 0))
                    ra1 = a0 + (a1 - a0) * ((r + 1) / 2 - (s if r == 0 else 0))
                    cb0 = b0 + (b1 - b0) * (c / 3 + (s if c else 0))
                    cb1 = b0 + (b1 - b0) * ((c + 1) / 3 - (s if c < 2 else 0))
                    body.append(path(quad(ra0, ra1, cb0, cb1)))
        else:
            body.append(path(quad(a0, a1, b0, b1)))
            # a row of status LEDs across the middle of the block
            for t in (0.25, 0.5, 0.75):
                x, y, z = proj((a0 + a1) / 2, b0 + (b1 - b0) * t)
                if z > 0.25:
                    leds.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" '
                                f'r="{0.45 + 0.35 * z:.2f}"/>')

    # the last garden: the polar cap
    cap = [proj(CAP_LAT, math.radians(a)) for a in range(0, 360, 4)]
    tx, ty, _ = proj(math.pi / 2, 0)             # top of the visible cap
    top_y = min(y for _, y, *_ in cap)

    return f'''  <g id="planet">
    <circle cx="{CX}" cy="{CY}" r="{R + 1.6}" fill="none" stroke="{INK}" stroke-width="0.9"/>
    <path id="panels" fill="{INK}" d="{' '.join(body)}"/>
    <g id="leds" class="accent" fill="{WHITE}">
      {''.join(leds)}
    </g>
    <path id="garden" class="accent" fill="{WHITE}" d="{path(cap)}"/>
  </g>

  <g id="inhabitants" fill="{INK}">
    <!-- the tree -->
    <rect x="{tx + 4.6:.2f}" y="{top_y - 3:.2f}" width="1.9" height="{3 + (ty - top_y) + 1:.2f}"/>
    <rect x="{tx + 4.6:.2f}" y="{top_y - 11:.2f}" width="1.9" height="9"/>
    <circle cx="{tx + 5.55:.2f}" cy="{top_y - 15.5:.2f}" r="6.2"/>
    <circle cx="{tx + 1.8:.2f}" cy="{top_y - 12.2:.2f}" r="4.3"/>
    <circle cx="{tx + 9.4:.2f}" cy="{top_y - 12.6:.2f}" r="4.1"/>
    <!-- the person, looking out -->
    <circle cx="{tx - 7:.2f}" cy="{top_y - 10.8:.2f}" r="1.75"/>
    <path d="M {tx - 8.6:.2f} {top_y - 8.6:.2f} L {tx - 5.4:.2f} {top_y - 8.6:.2f} L {tx - 5.7:.2f} {top_y - 4.2:.2f} L {tx - 8.3:.2f} {top_y - 4.2:.2f} Z"/>
    <rect x="{tx - 8.2:.2f}" y="{top_y - 4.6:.2f}" width="1.0" height="{4.6 + (ty - top_y) * 0.5:.2f}"/>
    <rect x="{tx - 6.8:.2f}" y="{top_y - 4.6:.2f}" width="1.0" height="{4.6 + (ty - top_y) * 0.5:.2f}"/>
  </g>'''


from fontTools.ttLib import TTFont   # noqa: E402  (text fitting only)

_font = TTFont(str(ROOT / 'brand/fonts/files/SairaCondensed-Bold.ttf'))
_cmap, _hmtx = _font.getBestCmap(), _font['hmtx']
_upm = _font['head'].unitsPerEm
CAP = _font['OS/2'].sCapHeight / _upm


def adv(s):
    return sum(_hmtx[_cmap[ord(c)]][0] for c in s) / _upm


GAP = 2.4            # between lines

# The quote is a CAIS-style packed block to the right of the planet: every
# row is set to exactly the block width W, so big and small words interlock
# into one solid shape. Rows:
#   ('fill', text, stressed[, tail])   one line stretched to W
#   ('rot',  small, big)               `small` rotated 90° (reading upward),
#                                      as tall as `big`'s cap height, then
#                                      `big` filling the rest of the row
# Stressed words are the accent. Closing punctuation (`tail`) is set at
# PUNCT × the line's size. If the block is taller than BOTTOM − TOP, W shrinks
# and the block is centred vertically in the column.
COL_X = CX + R + 1.6 + 6.0                   # block's left edge
COL_W = 200 - 7.0 - COL_X                    # to the 7 mm safe edge
TOP, BOTTOM = 72.0, 184.0
ROW_GAP = 3.0
ROT_GAP = 2.0
PUNCT = 0.55
TXT = {
    'es': dict(
        title='«Creo que es bastante probable que toda la superficie de la '
              'Tierra acabe cubierta de paneles solares y centros de datos.» '
              '— Ilya Sutskever',
        rows=[('fill', '«CREO QUE ES', 0), ('fill', 'BASTANTE PROBABLE', 1),
              ('rot', 'QUE', 'TODA'), ('fill', 'LA SUPERFICIE DE LA', 0),
              ('fill', 'TIERRA', 1), ('rot', 'ACABE', 'CUBIERTA'),
              ('fill', 'DE PANELES SOLARES Y', 0),
              ('fill', 'CENTROS DE DATOS', 1, '.»')],
        attr='ILYA SUTSKEVER',
        sub='cofundador de OpenAI · «Ilya: the AI scientist shaping the world», The Guardian, 2023'),
    'en': dict(
        title='“I think it’s pretty likely the entire surface of the earth '
              'will be covered with solar panels and data centres.” '
              '— Ilya Sutskever',
        rows=[('fill', '“I THINK IT’S', 0), ('fill', 'PRETTY LIKELY', 1),
              ('rot', 'THE', 'ENTIRE'), ('fill', 'SURFACE OF THE', 0),
              ('fill', 'EARTH', 1), ('rot', 'WILL BE', 'COVERED'),
              ('fill', 'WITH SOLAR PANELS AND', 0),
              ('fill', 'DATA CENTRES', 1, '.”')],
        attr='ILYA SUTSKEVER',
        sub='OpenAI co-founder · “Ilya: the AI scientist shaping the world”, The Guardian, 2023'),
}


def row_geom(row, W):
    """Return (height, items); items are (kind, text, size, dx, stressed)."""
    if row[0] == 'fill':
        _, txt, stressed, *tail = row
        tail = tail[0] if tail else ''
        size = W / (adv(txt) + PUNCT * adv(tail))
        items = [('h', txt, size, 0.0, stressed)]
        if tail:
            items.append(('h', tail, size * PUNCT, adv(txt) * size, stressed))
        return size * CAP, items
    _, small, big = row
    # big at size s: cap height h = s·CAP. small rotated: its length
    # adv(small)·t = h, its thickness t·CAP. Solve adv(big)·s + gap + t·CAP = W.
    k = CAP * CAP / adv(small)                    # t·CAP = s·k
    s = (W - ROT_GAP) / (adv(big) + k)
    t = s * CAP / adv(small)
    thick = t * CAP
    return s * CAP, [('v', small, t, 0.0, False),
                     ('h', big, s, thick + ROT_GAP, True)]


def text_blocks(rows):
    W = COL_W
    while True:
        geo = [row_geom(r, W) for r in rows]
        total = sum(h for h, _ in geo) + ROW_GAP * (len(rows) - 1)
        if total <= BOTTOM - TOP:
            break
        W -= 0.5
    y = TOP + (BOTTOM - TOP - total) / 2
    out = []
    for h, items in geo:
        base = y + h
        for kind, txt, size, dx, stressed in items:
            attrs = ('class="accent" fill="#FFFFFF"' if stressed
                     else f'fill="{INK}"')
            if kind == 'h':
                out.append(f'    <text x="{COL_X + dx:.2f}" y="{base:.2f}" '
                           f'font-size="{size:.2f}" {attrs}>{txt}</text>')
            else:
                # rotated −90°: baseline runs upward along the right side of
                # its strip; text starts at the row's baseline
                x = COL_X + dx + size * CAP
                out.append(f'    <text x="0" y="0" font-size="{size:.2f}" '
                           f'transform="translate({x:.2f} {base:.2f}) rotate(-90)" '
                           f'{attrs}>{txt}</text>')
        y = base + ROW_GAP
    return '\n'.join(out)


def main():
    art = planet()
    for lang, t in TXT.items():
        src = (ROOT / 'designs/shoggoth-cara-amable' / f'{lang}.orange.front.svg').read_text()
        a = src.index('  <svg x=')
        logo = src[a:src.index('</svg>', a) + 6]
        svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!--
  Design: el-ultimo-jardin (chest, {'Spanish' if lang == 'es' else 'English'})
  Voice lane: B (a lab founder's own words)
  GENERATED by scripts/draw-planeta.py — edit there, not here.

  Layout (200 × 200 mm canvas):
    y=15..63    logo
    y=66..157   the planet (tiled in solar panels + data centres) with the
                last garden on top: one person, one tree
    right       the quote as a CAIS-style packed block (every row the same
                width; short connectors rotated 90° beside the big word)
    y=190..195  attribution
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
{text_blocks(t['rows'])}
  </g>

  <text id="attribution" x="100" y="192.6" {F} font-size="4.6" fill="{INK}" text-anchor="middle">{t['attr']} <tspan font-style="italic" font-size="3.6">· {t['sub']}</tspan></text>
</svg>
'''
        DESIGN.mkdir(exist_ok=True)
        (DESIGN / f'{lang}.orange.front.svg').write_text(svg)
        print(f'  wrote {lang}.orange.front.svg')


if __name__ == '__main__':
    main()
