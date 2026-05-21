#!/usr/bin/env python3
"""
Build designs/altman-fin-del-mundo/design.es{,.white,.black}.svg from the
committed assets in that folder.

This design is a typographic build of Sam Altman's "fin del mundo"
quote: three lines progressing in size (`MUY PROBABLEMENTE` → `LA IA
CONDUCIRÁ AL` → `FIN DEL MUNDO`) with `IA` highlighted, plus a small
hand-drawn portrait stencil + compact attribution.

Original artwork by a chapter contributor in Photoshop. The PSD is NOT
committed; the script reads the derived assets from `assets/`:

  - assets/manifest.json          PSD layer bboxes (for layout positions)
  - assets/quote-1.png            "MUY PROBABLEMENTE"           (raster)
  - assets/quote-2.png            "LA IA CONDUCIRÁ AL"          (raster)
  - assets/quote-3.png            "FIN DEL MUNDO"               (raster)
  - assets/attribution-source.png Reference for attribution sizing
  - assets/stencil.svg            Hand-drawn portrait, vectorized
                                  via potrace (open it in a browser
                                  to see the source illustration)

The three quote PNGs are the cached bitmaps of the contributor's PSD
type layers, kept as raster because vectorizing them with potrace
chains the letters together via anti-aliased edges. The stencil is
vector. The header (chapter logo) is vector, from brand/logos/.

To regenerate from an updated PSD: run scripts/extract-altman-assets.py
(not committed — ask Claude to recreate it from this design's commit
history when needed).

Run from the repo root:
    python3 scripts/build-altman-fin-del-mundo.py
"""
import base64
import json
import re
from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DESIGN = ROOT / 'designs/altman-fin-del-mundo'
ASSETS = DESIGN / 'assets'
FONT = str(ROOT / 'brand/fonts/files/BebasNeue-Regular.ttf')

# ---------------------------------------------------------------------
# Layout — 240 x 240 mm canvas (24 x 24 cm chest print, agreed with
# the printer). Logo big at top, then quote, then stencil+attribution.
# ---------------------------------------------------------------------
CANVAS_MM = 240
PSD_ANCHOR_X = 640                 # PSD x of the design's vertical centre
PSD_ANCHOR_Y = 388                 # PSD y where the first quote line tops
SVG_ANCHOR_X = CANVAS_MM / 2       # canvas centre, x = 120
SVG_ANCHOR_Y = 66                  # quote line 1 top in SVG
SCALE = 0.62                       # PSD px → SVG mm conversion
UPSCALE = 8                        # 8× upscale on embedded PNGs → 328 DPI at 24 cm

LOGO_W = 180
LOGO_H = int(round(LOGO_W * 929 / 3400))
LOGO_Y = 5

# Pull the stencil + attribution row up by this many mm so the bigger
# logo + the increased gap above the quote both fit. The PSD's natural
# gap is ~17 mm at SCALE 0.62; we tighten it to ~7 mm.
STENCIL_ROW_OFFSET_Y = -10

ORANGE = '#FF9416'
WHITE = '#FFFFFF'
BLACK = '#000000'


# ---------------------------------------------------------------------
# Asset loading
# ---------------------------------------------------------------------
manifest = json.loads((ASSETS / 'manifest.json').read_text())


def load_layer(filename):
    return Image.open(ASSETS / filename).convert('RGBA')


def layer_bbox(filename):
    return tuple(manifest['layers'][filename]['bbox_psd'])


def psd_to_svg(px, py):
    return (
        (px - PSD_ANCHOR_X) * SCALE + SVG_ANCHOR_X,
        (py - PSD_ANCHOR_Y) * SCALE + SVG_ANCHOR_Y,
    )


def logo_inner(variant):
    """Inline the chapter logo paths from brand/logos/."""
    svg_text = (ROOT / f'brand/logos/pauseai-es-on-{variant}.svg').read_text()
    m = re.search(r'<svg[^>]*viewBox="0 0 3400 929"[^>]*>(.*)</svg>',
                  svg_text, re.DOTALL)
    return m.group(1).strip()


# ---------------------------------------------------------------------
# Image manipulation helpers
# ---------------------------------------------------------------------
def measure_cap_height(im):
    arr = np.array(im.convert('RGBA'))
    alpha = arr[..., 3]
    lum = (0.299 * arr[..., 0] + 0.587 * arr[..., 1] + 0.114 * arr[..., 2])
    dark = (alpha > 220) & (lum < 60)
    if not dark.any():
        return im.size[1]
    ys = np.where(dark.any(axis=1))[0]
    return int(ys.max() - ys.min() + 1)


def render_text(text, height_px, color=(0, 0, 0, 255)):
    em_pt = int(round(height_px / 0.745))
    font = ImageFont.truetype(FONT, size=em_pt)
    dummy = Image.new('RGBA', (1, 1))
    bbox = ImageDraw.Draw(dummy).textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0] + 4
    h = bbox[3] - bbox[1] + 4
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(img).text((-bbox[0] + 2, -bbox[1] + 2), text,
                              font=font, fill=color)
    a = np.array(img)[..., 3]
    ys = np.where(a.any(axis=1))[0]
    xs = np.where(a.any(axis=0))[0]
    return img.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def add_guillemet_left(layer_im, glyph='«'):
    cap = measure_cap_height(layer_im)
    g = render_text(glyph, cap)
    arr = np.array(layer_im.convert('RGBA'))
    alpha = arr[..., 3]
    lum = (0.299 * arr[..., 0] + 0.587 * arr[..., 1] + 0.114 * arr[..., 2])
    dark = (alpha > 220) & (lum < 60)
    ys = np.where(dark.any(axis=1))[0]
    text_top, text_bot = int(ys.min()), int(ys.max())
    gap = max(2, int(cap * 0.18))
    new_w = layer_im.size[0] + g.size[0] + gap
    out = Image.new('RGBA', (new_w, layer_im.size[1]), (0, 0, 0, 0))
    g_y = text_top + (text_bot - text_top + 1 - g.size[1]) // 2
    out.paste(g, (0, max(0, g_y)), g)
    out.paste(layer_im, (g.size[0] + gap, 0), layer_im)
    return out


def add_guillemet_right(layer_im, glyph='.»'):
    cap = measure_cap_height(layer_im)
    g = render_text(glyph, cap)
    arr = np.array(layer_im.convert('RGBA'))
    alpha = arr[..., 3]
    lum = (0.299 * arr[..., 0] + 0.587 * arr[..., 1] + 0.114 * arr[..., 2])
    dark = (alpha > 220) & (lum < 60)
    ys = np.where(dark.any(axis=1))[0]
    text_top, text_bot = int(ys.min()), int(ys.max())
    gap = max(1, int(cap * 0.05))
    new_w = layer_im.size[0] + g.size[0] + gap
    out = Image.new('RGBA', (new_w, layer_im.size[1]), (0, 0, 0, 0))
    out.paste(layer_im, (0, 0), layer_im)
    g_y = text_top + (text_bot - text_top + 1 - g.size[1]) // 2
    out.paste(g, (layer_im.size[0] + gap, max(0, g_y)), g)
    return out


def render_attribution(target_w, target_h):
    leading = max(1, target_h // 12)
    cap = (target_h - leading) // 2
    line1 = render_text('SAM ALTMAN, 2015', cap)
    line2 = render_text('HOY ES CEO DE OPENAI', cap)
    widest = max(line1.size[0], line2.size[0])
    if widest > target_w:
        scale = target_w / widest
        cap = max(6, int(cap * scale * 0.95))
        line1 = render_text('SAM ALTMAN, 2015', cap)
        line2 = render_text('HOY ES CEO DE OPENAI', cap)
    out = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))
    out.paste(line1, ((target_w - line1.size[0]) // 2, 0), line1)
    out.paste(line2, ((target_w - line2.size[0]) // 2,
                       line1.size[1] + leading), line2)
    return out


def recolor(im, mode):
    """mode: 'orange' (no change), 'white' (white→orange), 'black'
    (black→white, white→orange)."""
    if mode == 'orange':
        return im
    arr = np.array(im.convert('RGBA')).copy()
    alpha = arr[..., 3]
    lum = (0.299 * arr[..., 0].astype(float)
           + 0.587 * arr[..., 1].astype(float)
           + 0.114 * arr[..., 2].astype(float))
    is_black = (alpha > 0) & (lum < 80)
    is_white = (alpha > 0) & (lum > 220)
    if mode == 'black':
        arr[is_black, 0] = 255
        arr[is_black, 1] = 255
        arr[is_black, 2] = 255
    # both 'white' and 'black' swap white pixels to orange
    arr[is_white, 0] = 0xFF
    arr[is_white, 1] = 0x94
    arr[is_white, 2] = 0x16
    return Image.fromarray(arr)


def encode_png(im):
    buf = BytesIO()
    im.save(buf, format='PNG', optimize=True)
    return base64.b64encode(buf.getvalue()).decode('ascii')


def emit_image(b64, x_psd, y_psd, w_psd, h_psd):
    sx, sy = psd_to_svg(x_psd, y_psd)
    return (
        f'  <image href="data:image/png;base64,{b64}" '
        f'x="{sx:.2f}" y="{sy:.2f}" '
        f'width="{w_psd*SCALE:.2f}" height="{h_psd*SCALE:.2f}" '
        f'preserveAspectRatio="none"/>'
    )


def shift_y(image_xml, dy):
    return re.sub(
        r'(y=")([\d.]+)(")',
        lambda m: f'{m.group(1)}{float(m.group(2)) + dy:.2f}{m.group(3)}',
        image_xml, count=1,
    )


# ---------------------------------------------------------------------
# Build one variant
# ---------------------------------------------------------------------
def build_variant(tee_color):
    """tee_color in {'orange', 'white', 'black'}."""
    images = []
    # Quote line 1: + opening guillemet «
    im = recolor(add_guillemet_left(load_layer('quote-1.png')), tee_color)
    big = im.resize((im.size[0] * UPSCALE, im.size[1] * UPSCALE), Image.LANCZOS)
    bbox = layer_bbox('quote-1.png')
    extra_w = im.size[0] - (bbox[2] - bbox[0])
    images.append(emit_image(encode_png(big), bbox[0] - extra_w, bbox[1],
                              im.size[0], im.size[1]))

    # Quote line 2: unchanged
    im = recolor(load_layer('quote-2.png'), tee_color)
    big = im.resize((im.size[0] * UPSCALE, im.size[1] * UPSCALE), Image.LANCZOS)
    bbox = layer_bbox('quote-2.png')
    images.append(emit_image(encode_png(big), bbox[0], bbox[1],
                              im.size[0], im.size[1]))

    # Quote line 3: + closing .»
    im = recolor(add_guillemet_right(load_layer('quote-3.png')), tee_color)
    big = im.resize((im.size[0] * UPSCALE, im.size[1] * UPSCALE), Image.LANCZOS)
    bbox = layer_bbox('quote-3.png')
    images.append(emit_image(encode_png(big), bbox[0], bbox[1],
                              im.size[0], im.size[1]))

    # Attribution: re-render with the corrected 2015 date.
    template = load_layer('attribution-source.png')
    attr_im = render_attribution(template.size[0], template.size[1])
    attr_im = recolor(attr_im, tee_color)
    big = attr_im.resize((attr_im.size[0] * UPSCALE, attr_im.size[1] * UPSCALE),
                          Image.LANCZOS)
    bbox = layer_bbox('attribution-source.png')
    attr_xml = emit_image(encode_png(big), bbox[0], bbox[1],
                          attr_im.size[0], attr_im.size[1])
    # Pull attribution + stencil row up so the bigger logo fits
    images.append(shift_y(attr_xml, STENCIL_ROW_OFFSET_Y))

    # Stencil — read path + viewBox from assets/stencil.svg
    stencil_svg = (ASSETS / 'stencil.svg').read_text()
    vb_m = re.search(r'viewBox="0 0 (\d+) (\d+)"', stencil_svg)
    pw, ph = int(vb_m.group(1)), int(vb_m.group(2))
    path_m = re.search(r'<path d="([^"]+)"', stencil_svg)
    path_d = path_m.group(1)
    sbbox = tuple(manifest['stencil_bbox_psd'])
    sx, sy = psd_to_svg(sbbox[0], sbbox[1])
    sy += STENCIL_ROW_OFFSET_Y
    w_mm = (sbbox[2] - sbbox[0]) * SCALE
    h_mm = (sbbox[3] - sbbox[1]) * SCALE
    stencil_fill = WHITE if tee_color == 'black' else BLACK
    images.append(
        f'  <g transform="translate({sx:.2f} {sy:.2f}) '
        f'scale({w_mm/pw:.4f} {h_mm/ph:.4f})" fill="{stencil_fill}">\n'
        f'    <path d="{path_d}"/>\n'
        f'  </g>'
    )

    logo_variant = {'orange': 'orange', 'white': 'light', 'black': 'dark'}[tee_color]
    logo_x_mm = (CANVAS_MM - LOGO_W) / 2
    svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<!--
  altman-fin-del-mundo — {tee_color}-tee variant
  240 x 240 mm canvas (24 x 24 cm chest print). Logo vector (no swap),
  3 quote lines + attribution as embedded raster (~328 DPI at print),
  face stencil as vector. Per-tee colour swap: white pixels → orange;
  on black tee, black pixels → white. Header (logo) exempt from swap.
  Generated by scripts/build-altman-fin-del-mundo.py — do not edit by
  hand; edit the script or the assets in this folder.
-->
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 {CANVAS_MM} {CANVAS_MM}"
     width="{CANVAS_MM}mm" height="{CANVAS_MM}mm"
     role="img"
     aria-label="Muy probablemente la IA conducirá al fin del mundo. Sam Altman, 2015.">
  <title>Altman fin del mundo ({tee_color} tee)</title>

  <svg x="{logo_x_mm}" y="{LOGO_Y}" width="{LOGO_W}" height="{LOGO_H}"
       viewBox="0 0 3400 929">
    <title>PauseAI en Español</title>
{logo_inner(logo_variant)}
  </svg>

{chr(10).join(images)}
</svg>
"""
    suffix = '' if tee_color == 'orange' else f'.{tee_color}'
    out = DESIGN / f'design.es{suffix}.svg'
    out.write_text(svg)
    return out, len(svg)


def main():
    for tee in ('orange', 'white', 'black'):
        out, n = build_variant(tee)
        print(f'  wrote {out.relative_to(ROOT)}  ({n:,} chars)')


if __name__ == '__main__':
    main()
