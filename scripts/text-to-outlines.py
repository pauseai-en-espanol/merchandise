#!/usr/bin/env python3
"""
Convert live <text> elements in a design SVG to outlined <path>s using
fontTools, so the printer doesn't need to install Saira Condensed.

Reads SVG inputs, locates every <text> element, looks up each character
in brand/fonts/files/SairaCondensed-Bold.ttf, and emits the equivalent
SVG path data (one glyph per <path>, grouped inside the original <text>'s
fill/opacity/transform so positioning is preserved).

Saira Condensed has no native Italic in Google Fonts, so font-style
"italic" is rendered as a synthetic oblique via skewX(-12deg) around the
text baseline — visually close to a true italic for chest-print purposes.

Run from the repo root:
    python3 scripts/text-to-outlines.py <input.svg> [<input.svg> ...]

For each `<input>.svg` writes `<input>.outlines.svg` next to it.
"""
import re
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent

# Map the font-family declared in the source SVG to a TTF file. First
# token before the comma is used as the lookup key. Add new entries
# here when a design genuinely needs a font outside the chapter spec
# (e.g. the contributor-provided altman-cartel-stencil uses Bebas Neue).
FONT_FILES = {
    "Saira Condensed": ROOT / "brand/fonts/files/SairaCondensed-Bold.ttf",
    "Bebas Neue":      ROOT / "brand/fonts/files/BebasNeue-Regular.ttf",
}
DEFAULT_FONT_KEY = "Saira Condensed"

SVG_NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG_NS)


def load_font(path: Path):
    font = TTFont(str(path))
    cmap = font.getBestCmap()
    glyph_set = font.getGlyphSet()
    hmtx = font["hmtx"].metrics
    upm = font["head"].unitsPerEm
    return dict(font=font, cmap=cmap, glyph_set=glyph_set, hmtx=hmtx, upm=upm)


def cap_height_units(font) -> float:
    """Cap height in font units (OS/2.sCapHeight, then 'H' yMax, then
    0.7·em). Used to vertically centre dominant-baseline central/middle."""
    try:
        ch = font["OS/2"].sCapHeight
        if ch and ch > 0:
            return float(ch)
    except (KeyError, AttributeError):
        pass
    try:
        g = font["glyf"][font.getBestCmap().get(ord("H"))]
        if g.yMax is not None:
            return float(g.yMax)
    except (KeyError, AttributeError, TypeError):
        pass
    return font["head"].unitsPerEm * 0.7


def glyph_for_char(font_data, char):
    """Return (path_d, advance) in font units, or (None, fallback_advance)."""
    code = ord(char)
    if code not in font_data["cmap"]:
        # Unknown glyph — advance by half an em as a fallback (rare).
        return "", font_data["upm"] / 2
    name = font_data["cmap"][code]
    glyph = font_data["glyph_set"][name]
    pen = SVGPathPen(font_data["glyph_set"])
    glyph.draw(pen)
    advance = font_data["hmtx"][name][0]
    return pen.getCommands(), advance


def measure(font_data, text):
    """Total advance width in font units for the string."""
    total = 0
    for char in text:
        _, adv = glyph_for_char(font_data, char)
        total += adv
    return total


def text_to_path_group(font_data, text, x, y, size, anchor, fill, style,
                       transform=None, dominant_baseline=None):
    """
    Build a single <g> containing the outlined text.

    Glyphs come from the font in Y-up coordinates with origin at the
    glyph's baseline. We compose a matrix that:
      - flips Y (font Y-up → SVG Y-down)
      - scales font units → SVG units
      - translates to (x, y) so y == baseline in SVG space

    For text-anchor="middle" we shift left by half the total advance.
    For "end" we shift left by the full advance.
    Synthetic italic = skewX on the resulting group (around baseline).
    A `dominant-baseline` of central/middle drops the baseline half a
    cap-height so the cap-box centres on y. An element `transform`
    (e.g. rotate) wraps the whole group so its pivot stays in user space.
    """
    upm = font_data["upm"]
    scale = size / upm

    if dominant_baseline in ("central", "middle"):
        y = y + (cap_height_units(font_data["font"]) * scale) / 2

    total_advance = measure(font_data, text) * scale

    if anchor == "middle":
        x_origin = x - total_advance / 2
    elif anchor == "end":
        x_origin = x - total_advance
    else:
        x_origin = x

    # Emit each glyph as its own <path>, offset by cumulative advance.
    paths = []
    advance_units = 0
    for char in text:
        path_d, adv = glyph_for_char(font_data, char)
        if path_d:
            tx = x_origin + advance_units * scale
            # matrix: a=scale, b=0, c=0, d=-scale, e=tx, f=y
            paths.append(
                f'    <path d="{path_d}" '
                f'transform="matrix({scale} 0 0 {-scale} {tx} {y})"/>'
            )
        advance_units += adv

    g_attrs = [f'fill="{fill}"']
    if style and "italic" in style.lower():
        # Skew around the baseline pivot at the current x_origin so the
        # text stays visually aligned with the original baseline.
        g_attrs.append(
            f'transform="matrix(1 0 -0.2126 1 {x_origin * 0.2126:.4f} 0)"'
        )
    inner = f"  <g {' '.join(g_attrs)}>\n" + "\n".join(paths) + "\n  </g>"
    if transform:
        # Outermost so a rotate pivots in the parent user space, exactly
        # as a renderer applies transform to the original <text>.
        return f'  <g transform="{transform}">\n{inner}\n  </g>'
    return inner


def convert_svg(svg_path: Path, font_data_by_family):
    s = svg_path.read_text()

    # Build a map of `<g ...>` open tags → inherited text attributes, so
    # we can resolve attributes that the SVG put on a parent group
    # (font-family, fill, text-anchor, font-size, ...) rather than on
    # each <text>. This is the SVG normal way to declutter.
    # We walk the source linearly, tracking the open-group stack.
    text_re = re.compile(r"<text\b([^>]*)>([^<]*)</text>", flags=re.DOTALL)
    group_open_re = re.compile(r"<g\b([^>]*)>")
    group_close_re = re.compile(r"</g>")

    def attr_in(tag_attrs, name, default=None):
        m = re.search(rf'\b{name}="([^"]*)"', tag_attrs)
        return m.group(1) if m else default

    # Find ranges of each <g> block; for any position, we can compute
    # the stack of enclosing groups by walking from the start.
    def inherited_attr(pos, name, default=None):
        """Walk linearly to `pos`, tracking <g> opens/closes, return the
        innermost matching attribute or default."""
        stack = []
        i = 0
        while i < pos:
            gm = group_open_re.search(s, i, pos)
            cm = group_close_re.search(s, i, pos)
            if gm and (not cm or gm.start() < cm.start()):
                v = attr_in(gm.group(1), name)
                stack.append(v)
                i = gm.end()
            elif cm:
                if stack:
                    stack.pop()
                i = cm.end()
            else:
                break
        for v in reversed(stack):
            if v is not None:
                return v
        return default

    def attr(tag_attrs, name, pos, default=None):
        """Read attribute from the text tag, falling back to inherited."""
        v = attr_in(tag_attrs, name)
        if v is not None:
            return v
        return inherited_attr(pos, name, default)

    def replace(m):
        tag_attrs = m.group(1)
        content = m.group(2).strip()
        if not content:
            return m.group(0)
        pos = m.start()

        family_attr = attr(tag_attrs, "font-family", pos, "")
        family_key = family_attr.split(",")[0].strip().strip('"')
        font_data = font_data_by_family.get(
            family_key, font_data_by_family[DEFAULT_FONT_KEY]
        )

        x = float(attr(tag_attrs, "x", pos, "0"))
        y = float(attr(tag_attrs, "y", pos, "0"))
        size = float(attr(tag_attrs, "font-size", pos, "12"))
        anchor = attr(tag_attrs, "text-anchor", pos, "start")
        fill = attr(tag_attrs, "fill", pos, "#000000")
        style = attr(tag_attrs, "font-style", pos, "")

        fill_op = attr(tag_attrs, "fill-opacity", pos)
        if fill_op:
            fill = f'{fill}" fill-opacity="{fill_op}'  # quick splice

        # transform is per-element in SVG (not inherited); read off the tag.
        transform = attr_in(tag_attrs, "transform")
        dominant_baseline = attr(tag_attrs, "dominant-baseline", pos)

        return text_to_path_group(
            font_data, content, x, y, size, anchor, fill, style,
            transform=transform, dominant_baseline=dominant_baseline,
        )

    new_svg = text_re.sub(replace, s)
    out = svg_path.with_suffix("").with_suffix(".outlines.svg")
    if str(out) == str(svg_path):
        out = svg_path.parent / (svg_path.stem + ".outlines.svg")
    # Above safeguard handles design.es.svg → design.es.outlines.svg too:
    if svg_path.name.endswith(".svg"):
        out = svg_path.parent / (svg_path.name[:-4] + ".outlines.svg")
    out.write_text(new_svg)
    print(f"  wrote {out.relative_to(ROOT)}")


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    font_data_by_family = {
        family: load_font(path) for family, path in FONT_FILES.items()
    }
    for arg in sys.argv[1:]:
        convert_svg(Path(arg).resolve(), font_data_by_family)


if __name__ == "__main__":
    main()
