#!/usr/bin/env python3
"""
Export print-ready SVGs with all text converted to outline paths
(zero font dependency at print time).

Output:
  prints/<slug>-front.svg   240 × 240 mm  (chest print 24 × 24 cm)
  prints/<slug>-back.svg    200 × 220 mm  (back print  20 × 22 cm)

Each <text> element is replaced by a <g> of <path> elements drawn
from the Saira Condensed Bold TTF in brand/fonts/files/. Italic is
synthesized with a skewX(-10°) transform on the run group, since the
chapter committed only the regular weight to the repo.

Fronts at 200 × 200 mm are scaled up by 1.2 to fill the 240 × 240 mm
canvas. The altman-fin-del-mundo design is already 240 × 240, so no
scale is applied there.

Backs at 200 × 200 mm are placed inside a 200 × 220 mm canvas — the
content stays in its original 200 × 200 top region; the extra 20 mm
sit below the wordmark.

Run from repo root:
    python3 scripts/print-export.py
"""
import math
import re
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

ROOT = Path(__file__).resolve().parent.parent
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)

PRINT_DIR = ROOT / 'prints'
PRINT_DIR.mkdir(exist_ok=True)

# --- Font handling ---------------------------------------------------

FONT_PATH = ROOT / 'brand/fonts/files/SairaCondensed-Bold.ttf'
FONT = TTFont(str(FONT_PATH))
UNITS_PER_EM = FONT['head'].unitsPerEm
CMAP = FONT.getBestCmap()
GLYPH_SET = FONT.getGlyphSet()
HMTX = FONT['hmtx']

ITALIC_SKEW_DEG = 10  # synthetic italic angle


def char_to_path(ch: str) -> tuple[str, int]:
    """Return (SVG path d-string, advance width in font units) for a char."""
    gname = CMAP.get(ord(ch))
    if not gname:
        return '', 0
    pen = SVGPathPen(GLYPH_SET)
    GLYPH_SET[gname].draw(pen)
    advance, _lsb = HMTX[gname]
    return pen.getCommands(), advance


# --- SVG manipulation ------------------------------------------------

TEXT_TAG = f'{{{NS}}}text'
TSPAN_TAG = f'{{{NS}}}tspan'
G_TAG = f'{{{NS}}}g'
PATH_TAG = f'{{{NS}}}path'
SVG_TAG = f'{{{NS}}}svg'


def _resolve(elem, name, default=None, inherited=None):
    """Look up an attribute on elem, then on inherited dict, then default."""
    if name in elem.attrib:
        return elem.attrib[name]
    if inherited and name in inherited:
        return inherited[name]
    return default


def _runs_from_text(elem, inherited_fill):
    """Walk a <text> element, return list of (text, fill) runs."""
    fill = _resolve(elem, 'fill', inherited_fill or '#000000')
    runs = []
    if elem.text:
        runs.append((elem.text, fill))
    for child in elem:
        if child.tag == TSPAN_TAG:
            child_fill = _resolve(child, 'fill', fill)
            if child.text:
                runs.append((child.text, child_fill))
        if child.tail:
            runs.append((child.tail, fill))
    return runs


def text_to_outlines(elem, inherited):
    """Replace a <text> element with a <g> of outlined paths."""
    text_x = float(_resolve(elem, 'x', '0', inherited))
    text_y = float(_resolve(elem, 'y', '0', inherited))
    font_size_str = _resolve(elem, 'font-size', '12', inherited)
    font_size = float(re.match(r'[\d.]+', str(font_size_str)).group(0))
    font_style = _resolve(elem, 'font-style', 'normal', inherited)
    text_anchor = _resolve(elem, 'text-anchor', 'start', inherited)
    fill = _resolve(elem, 'fill', '#000000', inherited)

    runs = _runs_from_text(elem, fill)
    if not runs:
        return None

    scale = font_size / UNITS_PER_EM

    total_advance = 0
    for run_text, _ in runs:
        for ch in run_text:
            _, adv = char_to_path(ch)
            total_advance += adv
    total_width = total_advance * scale

    if text_anchor == 'middle':
        start_x = text_x - total_width / 2
    elif text_anchor == 'end':
        start_x = text_x - total_width
    else:
        start_x = text_x

    skew = (f'skewX({-ITALIC_SKEW_DEG}) '
            if font_style == 'italic' else '')

    outer = ET.Element(G_TAG)
    outer.set(
        'transform',
        f'translate({start_x:.4f} {text_y:.4f}) '
        f'{skew}scale({scale:.6f} {-scale:.6f})'
    )

    cursor_units = 0  # in font units, relative to outer transform origin
    for run_text, run_fill in runs:
        if not run_text:
            continue
        run_g = ET.SubElement(outer, G_TAG)
        run_g.set('fill', run_fill)
        for ch in run_text:
            path_d, adv = char_to_path(ch)
            if path_d:
                p = ET.SubElement(run_g, PATH_TAG)
                p.set('d', path_d)
                if cursor_units:
                    p.set('transform', f'translate({cursor_units} 0)')
            cursor_units += adv

    return outer


def walk(parent, inherited):
    """Recurse and replace <text> children with outlined <g>."""
    for i, child in enumerate(list(parent)):
        if child.tag == TEXT_TAG:
            outlined = text_to_outlines(child, inherited)
            if outlined is not None:
                parent[i] = outlined
        elif child.tag in (G_TAG, SVG_TAG):
            inh = dict(inherited)
            for k in ('font-family', 'font-weight', 'font-style',
                      'font-size', 'fill', 'text-anchor'):
                if k in child.attrib:
                    inh[k] = child.attrib[k]
            walk(child, inh)


def outline_svg(svg_str: str) -> ET.Element:
    """Parse SVG, replace all <text> with outlined <g>, return root."""
    root = ET.fromstring(svg_str)
    walk(root, {})
    return root


# --- Per-design assembly --------------------------------------------

def export_front(slug: str, src_svg: Path, dst: Path) -> None:
    """Scale design.es.svg into a 240 × 240 mm canvas (1.2× scale for
    200 × 200 sources; identity for 240 × 240 sources)."""
    src_text = src_svg.read_text()
    root = outline_svg(src_text)

    vb = root.attrib.get('viewBox', '0 0 200 200').split()
    src_w, src_h = float(vb[2]), float(vb[3])
    scale = 240 / src_w if abs(src_w - 240) > 0.01 else 1.0

    # Move root's children under a transform group.
    g = ET.Element(G_TAG)
    if scale != 1.0:
        g.set('transform', f'scale({scale})')
    for child in list(root):
        root.remove(child)
        g.append(child)
    root.append(g)

    root.set('viewBox', '0 0 240 240')
    root.set('width', '240mm')
    root.set('height', '240mm')

    dst.write_text(ET.tostring(root, encoding='unicode', xml_declaration=False))
    print(f'  wrote prints/{dst.name}  '
          f'(source {int(src_w)}×{int(src_h)} → 240×240, scale {scale}, '
          f'{dst.stat().st_size:,} bytes)')


def export_back(slug: str, src_svg: Path, dst: Path) -> None:
    """Place back.svg content into a 200 × 220 mm canvas (extra 20 mm
    below the existing content)."""
    src_text = src_svg.read_text()
    root = outline_svg(src_text)

    root.set('viewBox', '0 0 200 220')
    root.set('width', '200mm')
    root.set('height', '220mm')

    dst.write_text(ET.tostring(root, encoding='unicode', xml_declaration=False))
    print(f'  wrote prints/{dst.name}  '
          f'(canvas 200×220, {dst.stat().st_size:,} bytes)')


def main():
    designs = sorted(d.name for d in (ROOT / 'designs').iterdir()
                     if d.is_dir() and not d.name.startswith('_'))
    print(f'Exporting {len(designs)} designs...')
    for slug in designs:
        front_src = ROOT / f'designs/{slug}/design.es.svg'
        back_src = ROOT / f'designs/{slug}/back.svg'
        if front_src.exists():
            export_front(slug, front_src, PRINT_DIR / f'{slug}-front.svg')
        if back_src.exists():
            export_back(slug, back_src, PRINT_DIR / f'{slug}-back.svg')


if __name__ == '__main__':
    main()
