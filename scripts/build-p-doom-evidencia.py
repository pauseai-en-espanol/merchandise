#!/usr/bin/env python3
"""
Rebuild designs/p-doom-evidencia/design.es{.white,.black}.svg with
per-element color rules that the generic build-color-variants.py
cannot express in its swap-table.

Rule per tee:
  - body text (headline, names): WHITE on black tee, INK on white tee
  - accent text (percentages, "fin del mundo", footer): ORANGE on both

The orange canonical (design.es.svg) is unchanged — everything reads
white on the orange tee as before.

Run AFTER scripts/build-color-variants.py (which generates the back.svg
variants and any other side effects); this script overwrites just the
design.es.{white,black}.svg files with correct colours.

Run from the repo root:
    python3 scripts/build-p-doom-evidencia.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DESIGN = ROOT / 'designs/p-doom-evidencia'

ORANGE = '#FF9416'
WHITE = '#FFFFFF'
INK = '#111111'


def logo_inner(variant):
    """variant in {'orange', 'light', 'dark'}."""
    s = (ROOT / f'brand/logos/pauseai-es-on-{variant}.svg').read_text()
    m = re.search(r'<svg[^>]*viewBox="0 0 3400 929"[^>]*>(.*?)</svg>',
                  s, re.DOTALL)
    return m.group(1).strip()


def build_variant(orange_svg, tee_color):
    body = WHITE if tee_color == 'black' else INK
    logo_var = {'white': 'light', 'black': 'dark'}[tee_color]
    s = orange_svg

    # 1. Swap the inlined chapter logo to the right on-light/on-dark variant.
    new_inner = logo_inner(logo_var)
    s = re.sub(
        r'(<svg[^>]*viewBox="0 0 3400 929"[^>]*>)(.*?)(</svg>)',
        lambda m: m.group(1) + '\n' + new_inner + '\n' + m.group(3),
        s, count=1, flags=re.DOTALL,
    )

    # 2. Headline group: fill = body colour.
    #    (No \b before fill= because the SVG breaks the opening tag
    #    across lines and the previous char ends up being a non-word
    #    char — \b would fail to match between two non-word chars.)
    s = re.sub(
        r'(<g id="headline"[^>]*?fill=)"[^"]*"',
        lambda m: m.group(1) + f'"{body}"',
        s,
    )

    # 3. Evidence-table group: fill = body colour for the row names.
    #    Value column gets explicit fill=ORANGE below (overriding the
    #    explicit fill="#FFFFFF" the orange canonical sets per row).
    s = re.sub(
        r'(<g id="evidence-table"[^>]*?fill=)"[^"]*"',
        lambda m: m.group(1) + f'"{body}"',
        s,
    )

    def swap_value_fill(m):
        tag = m.group(0)
        tag = re.sub(r'\s*fill="[^"]*"', '', tag)
        return tag[:-1] + f' fill="{ORANGE}">'
    s = re.sub(r'<text x="178"[^>]*>', swap_value_fill, s)

    # 4. Footer: fill = ORANGE (was white in the orange canonical).
    s = re.sub(
        r'(<text\b(?:(?!fill=)[^>])*?\bid="footer"(?:(?!fill=)[^>])*?\bfill=)"[^"]*"',
        lambda m: m.group(1) + f'"{ORANGE}"',
        s,
    )
    return s


def main():
    orange_svg = (DESIGN / 'design.es.svg').read_text()
    for tee in ('white', 'black'):
        out_path = DESIGN / f'design.es.{tee}.svg'
        out_path.write_text(build_variant(orange_svg, tee))
        print(f'  wrote {out_path.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
