#!/usr/bin/env python3
"""
Build designs/altman-fin-del-mundo/design.es.{orange,white,black}.svg as
pure vector — `<text>` elements with Bebas Neue Regular (committed at
brand/fonts/files/BebasNeue-Regular.ttf), no raster PNG embeds.

This is the v2 of the design. v1 (which lived in the same script
earlier) embedded the contributor's PSD text layers as upscaled PNGs;
v2 reads only the PSD layer bboxes from `assets/manifest.json` and
emits `<text>` at the same positions, with font sizes derived from
the bbox heights and Bebas Neue's cap-height ratio (~0.745 of the em).

Per-tee colour:

  | Tee     | Body         | Accent (IA) |
  |---------|--------------|-------------|
  | Orange  | INK #111111  | WHITE       |
  | White   | INK #111111  | ORANGE      |
  | Black   | WHITE        | ORANGE      |

The chapter logo is inlined vector (swap per tee). The face stencil
(`assets/stencil.svg`) is inlined vector and recoloured per tee
(black on orange/white, white on black).

Run from the repo root:
    python3 scripts/build-altman-fin-del-mundo.py
"""
import json
import re
from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
DESIGN = ROOT / 'designs/altman-fin-del-mundo'
ASSETS = DESIGN / 'assets'

# Bebas Neue Regular for advance-width queries (used to compute the
# font-size that makes each line fill its PSD bbox width).
_FONT = TTFont(str(ROOT / 'brand/fonts/files/BebasNeue-Regular.ttf'))
_UPEM = _FONT['head'].unitsPerEm
_CMAP = _FONT.getBestCmap()
_HMTX = _FONT['hmtx']


def text_advance(text: str) -> int:
    """Sum of advance widths in font units for `text`."""
    total = 0
    for ch in text:
        gname = _CMAP.get(ord(ch))
        if gname:
            total += _HMTX[gname][0]
    return total


def font_size_for_width(text: str, target_width_mm: float) -> float:
    """The font-size (in user units, here mm) at which `text` renders
    at exactly `target_width_mm`."""
    advance = text_advance(text)
    if advance == 0:
        return 0.0
    return target_width_mm * _UPEM / advance

# --- Geometry --------------------------------------------------------
# Canvas in mm. The chapter prints this design at 24×24 cm.
CANVAS_MM = 240

# Anchor points map PSD pixel coords → SVG mm. The PSD canvas is
# 1280×1280; we center the design content on the SVG canvas via two
# anchor points (the design's vertical centre x, and the top of the
# first quote line y).
PSD_ANCHOR_X = 640
PSD_ANCHOR_Y = 388
SVG_ANCHOR_X = CANVAS_MM / 2     # 120
SVG_ANCHOR_Y = 66
SCALE = 0.62                     # PSD px → SVG mm

# Chapter logo banner across the top.
LOGO_W = 180
LOGO_H = int(round(LOGO_W * 929 / 3400))
LOGO_Y = 5

# Stencil + attribution row sits below the quote; pull it up so the
# bigger logo + the gap above the quote both fit.
STENCIL_ROW_OFFSET_Y = -10


ORANGE = '#FF9416'
WHITE = '#FFFFFF'
INK = '#111111'

manifest = json.loads((ASSETS / 'manifest.json').read_text())


def psd_to_svg(px, py):
    return (
        (px - PSD_ANCHOR_X) * SCALE + SVG_ANCHOR_X,
        (py - PSD_ANCHOR_Y) * SCALE + SVG_ANCHOR_Y,
    )


def layer_bbox(filename):
    return tuple(manifest['layers'][filename]['bbox_psd'])


def text_geometry(bbox_filename, text_for_sizing):
    """Return (center_x_svg, baseline_y_svg, font_size_svg) sized so
    that `text_for_sizing` exactly fills the PSD bbox width."""
    x1, y1, x2, y2 = layer_bbox(bbox_filename)
    x1_svg, y1_svg = psd_to_svg(x1, y1)
    x2_svg, y2_svg = psd_to_svg(x2, y2)
    width_svg = x2_svg - x1_svg
    font_size = font_size_for_width(text_for_sizing, width_svg)
    center_x = (x1_svg + x2_svg) / 2
    return center_x, y2_svg, font_size


def logo_inner(variant, lang='es'):
    """Inline the brand logo paths for the given variant and language.
    ES uses chapter logo (3400×929). EN uses global logo (1280×449 for
    orange/dark, 1331×449 for light)."""
    prefix = 'pauseai-es' if lang == 'es' else 'pauseai-global'
    svg_text = (ROOT / f'brand/logos/{prefix}-on-{variant}.svg').read_text()
    vb_alts = '0 0 3400 929' if lang == 'es' else '33 0 1214 449|0 0 1331 449'
    m = re.search(r'<svg[^>]*viewBox="(?:' + vb_alts + r')"[^>]*>(.*)</svg>',
                  svg_text, re.DOTALL)
    return m.group(1).strip()


LANG_CONFIG = {
    'es': {
        'logo_vb': '0 0 3400 929',
        'logo_h_ratio': 929 / 3400,
        'logo_w': 180,
        'svg_anchor_y': 66,            # quote top y
        'stencil_row_offset_y': -10,
        'quote_lines': [
            ('MUY PROBABLEMENTE', None, None),
            ('LA IA CONDUCIRÁ AL', 'LA ', 'IA', ' CONDUCIRÁ AL'),
            ('FIN DEL MUNDO', None, None),
        ],
        'attribution': ('SAM ALTMAN, 2015', 'HOY ES CEO DE OPENAI'),
    },
    'en': {
        'logo_vb': '33 0 1214 449',
        'logo_h_ratio': 449 / 1214,
        'logo_w': 180,
        'svg_anchor_y': 80,            # shifted down — taller EN logo
        'stencil_row_offset_y': -10,
        'quote_lines': [
            # "Most likely" matches Altman's actual phrasing ("most
            # likely") and gives line 1 enough characters to avoid an
            # absurdly large font that would collide with the logo.
            ('MOST LIKELY', None, None),
            ('AI WILL LEAD TO', '', 'AI', ' WILL LEAD TO'),
            ('THE END OF THE WORLD', None, None),
        ],
        'attribution': ('SAM ALTMAN, 2015', 'NOW CEO OF OPENAI'),
    },
}


def stencil_inner():
    """Return the stencil's viewBox + path d-string."""
    svg = (ASSETS / 'stencil.svg').read_text()
    vb = re.search(r'viewBox="0 0 (\d+) (\d+)"', svg)
    path = re.search(r'<path d="([^"]+)"', svg)
    return int(vb.group(1)), int(vb.group(2)), path.group(1)


def build_variant(tee_color, lang='es'):
    body_fill = WHITE if tee_color == 'black' else INK
    accent_fill = WHITE if tee_color == 'orange' else ORANGE
    stencil_fill = WHITE if tee_color == 'black' else INK
    logo_variant = {'orange': 'orange',
                    'white': 'light',
                    'black': 'dark'}[tee_color]
    cfg = LANG_CONFIG[lang]

    # Override the module-level SVG_ANCHOR_Y for this language so the
    # quote sits below the (possibly taller) logo.
    global SVG_ANCHOR_Y, STENCIL_ROW_OFFSET_Y
    SVG_ANCHOR_Y = cfg['svg_anchor_y']
    STENCIL_ROW_OFFSET_Y = cfg['stencil_row_offset_y']

    # Quote line texts come from the language config.
    line1 = cfg['quote_lines'][0][0]
    line2 = cfg['quote_lines'][1][0]
    line3 = cfg['quote_lines'][2][0]
    pre2, accent2, post2 = cfg['quote_lines'][1][1:4]

    cx1, _, fs1 = text_geometry('quote-1.png', line1)
    cx2, _, fs2 = text_geometry('quote-2.png', line2)
    cx3, y3, fs3 = text_geometry('quote-3.png', line3)
    # Equal *visual* spacing (cap-bottom to next cap-top), not just
    # equal baseline spacing. Cap heights differ across lines because
    # font-sizes differ, so equal baseline gaps would still LOOK
    # uneven. Solving: gap(L1→L2) == gap(L2→L3)
    #   = (y2 - cap_L2 - y1) == (y3 - cap_L3 - y2)
    #   → y2 = (y1 + y3 + cap_L2 - cap_L3) / 2
    # And pick y1 so L1's cap-top sits a fixed gap below the logo.
    BEBAS_CAP_RATIO = 0.745
    cap_L1 = fs1 * BEBAS_CAP_RATIO
    cap_L2 = fs2 * BEBAS_CAP_RATIO
    cap_L3 = fs3 * BEBAS_CAP_RATIO
    logo_bottom = LOGO_Y + int(round(LOGO_W * cfg['logo_h_ratio']))
    LOGO_GAP = 12  # mm — gap between logo bottom and L1 cap-top
    y1 = logo_bottom + LOGO_GAP + cap_L1
    y2 = (y1 + y3 + cap_L2 - cap_L3) / 2

    bbox1 = layer_bbox('quote-1.png')
    bbox3 = layer_bbox('quote-3.png')
    x1_left, _ = psd_to_svg(bbox1[0], bbox1[1])
    x3_right, _ = psd_to_svg(bbox3[2], bbox3[3])
    gap_guillemet = 2
    # Clamp the closing ".»" position so it stays inside the canvas
    # right margin. At ES font-size (FIN DEL MUNDO is the biggest
    # line), the ".»" otherwise overflows the 240 mm canvas by ~3 mm.
    CANVAS_MARGIN = 3
    closing_text = '.»'
    closing_width = fs3 * text_advance(closing_text) / _UPEM
    closing_x_ideal = x3_right + gap_guillemet
    closing_x_max = CANVAS_MM - CANVAS_MARGIN - closing_width
    closing_x = min(closing_x_ideal, closing_x_max)

    quote = (
        f'  <g id="quote"\n'
        f'     font-family="Bebas Neue, Impact, sans-serif"\n'
        f'     font-weight="400"\n'
        f'     fill="{body_fill}">\n'
        f'    <text x="{x1_left - gap_guillemet:.2f}" y="{y1:.2f}" '
        f'font-size="{fs1:.2f}" text-anchor="end">«</text>\n'
        f'    <text x="{cx1:.2f}" y="{y1:.2f}" '
        f'font-size="{fs1:.2f}" text-anchor="middle">{line1}</text>\n'
        f'    <text x="{cx2:.2f}" y="{y2:.2f}" '
        f'font-size="{fs2:.2f}" text-anchor="middle">{pre2}<tspan class="accent" '
        f'fill="{accent_fill}">{accent2}</tspan>{post2}</text>\n'
        f'    <text x="{cx3:.2f}" y="{y3:.2f}" '
        f'font-size="{fs3:.2f}" text-anchor="middle">{line3}</text>\n'
        f'    <text x="{closing_x:.2f}" y="{y3:.2f}" '
        f'font-size="{fs3:.2f}" text-anchor="start">.»</text>\n'
        f'  </g>'
    )

    # --- Stencil (vector) + attribution -------------------------------
    sbbox = tuple(manifest['stencil_bbox_psd'])
    sx, sy = psd_to_svg(sbbox[0], sbbox[1])
    sy += STENCIL_ROW_OFFSET_Y
    sw_mm = (sbbox[2] - sbbox[0]) * SCALE
    sh_mm = (sbbox[3] - sbbox[1]) * SCALE
    pw, ph, path_d = stencil_inner()
    stencil = (
        f'  <g id="stencil" '
        f'transform="translate({sx:.2f} {sy:.2f}) '
        f'scale({sw_mm/pw:.4f} {sh_mm/ph:.4f})" '
        f'fill="{stencil_fill}">\n'
        f'    <path d="{path_d}"/>\n'
        f'  </g>'
    )

    # Attribution: 2 lines stacked, derived from the source bbox.
    abbox_x1, abbox_y1, abbox_x2, abbox_y2 = layer_bbox(
        'attribution-source.png')
    ax1, ay1 = psd_to_svg(abbox_x1, abbox_y1)
    ax2, ay2 = psd_to_svg(abbox_x2, abbox_y2)
    ay1 += STENCIL_ROW_OFFSET_Y
    ay2 += STENCIL_ROW_OFFSET_Y
    # Width-sized like the quote lines: use the longer of the two
    # attribution lines to set the font-size, so both fit.
    attr_line_top, attr_line_bot = cfg['attribution']
    longest_attr = max(attr_line_top, attr_line_bot, key=len)
    a_width = ax2 - ax1
    a_font_size = font_size_for_width(longest_attr, a_width)
    a_center_x = (ax1 + ax2) / 2
    line_gap = a_font_size * 0.12
    a_y2 = ay2
    a_y1 = a_y2 - a_font_size * 0.7 - line_gap
    attribution = (
        f'  <g id="attribution"\n'
        f'     font-family="Bebas Neue, Impact, sans-serif"\n'
        f'     font-weight="400" font-size="{a_font_size:.2f}"\n'
        f'     fill="{body_fill}" text-anchor="middle">\n'
        f'    <text x="{a_center_x:.2f}" y="{a_y1:.2f}">{attr_line_top}</text>\n'
        f'    <text x="{a_center_x:.2f}" y="{a_y2:.2f}">{attr_line_bot}</text>\n'
        f'  </g>'
    )

    # --- Compose SVG --------------------------------------------------
    # Logo height depends on language (different viewBox aspect ratios).
    logo_w_local = cfg['logo_w']
    logo_h_local = int(round(logo_w_local * cfg['logo_h_ratio']))
    logo_x_mm = (CANVAS_MM - logo_w_local) / 2
    aria_label = ('Muy probablemente la IA conducirá al fin del mundo. '
                  'Sam Altman, 2015.' if lang == 'es' else
                  'Most likely AI will lead to the end of the world. '
                  'Sam Altman, 2015.')
    svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<!--
  altman-fin-del-mundo ({lang}) — {tee_color}-tee variant
  240 × 240 mm canvas. Vector: brand logo + 3 quote lines + stencil
  + attribution (Bebas Neue). Generated by build-altman-fin-del-mundo.py.
-->
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 {CANVAS_MM} {CANVAS_MM}"
     width="{CANVAS_MM}mm" height="{CANVAS_MM}mm"
     role="img"
     aria-label="{aria_label}">
  <title>Altman fin del mundo ({lang} / {tee_color} tee)</title>

  <svg x="{logo_x_mm}" y="{LOGO_Y}" width="{logo_w_local}" height="{logo_h_local}"
       viewBox="{cfg['logo_vb']}">
    <title>PauseAI</title>
{logo_inner(logo_variant, lang)}
  </svg>

{quote}

{stencil}

{attribution}
</svg>
"""
    out = DESIGN / f'{lang}.{tee_color}.front.svg'
    out.write_text(svg)
    return out, len(svg)


def main():
    for lang in ('es', 'en'):
        for tee in ('orange', 'white', 'black'):
            out, n = build_variant(tee, lang)
            print(f'  wrote {out.relative_to(ROOT)}  ({n:,} chars)')


if __name__ == '__main__':
    main()
