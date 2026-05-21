#!/usr/bin/env python3
"""
Rebuild designs/preguntame/design.es{.white,.black}.svg with the
per-word accent rule the generic build-color-variants.py can't
express:

  - body text (Si te preocupa la / y quieres hablar / ME TIENES.):
    WHITE on black tee, INK on white tee
  - accent words (IA, AQUÍ): ORANGE on both variants

The orange canonical keeps everything white (accent <tspan> elements
inherit the parent text fill).

Run AFTER scripts/build-color-variants.py so back.* variants are
already in place; this script overwrites just the design.es.{white,
black}.svg files with the correct per-word colours.

Run from the repo root:
    python3 scripts/build-preguntame.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DESIGN = ROOT / 'designs/preguntame'

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
    """Canonical (orange tee): body INK, accents (IA/AQUÍ) WHITE.

    White tee:  body stays INK,    accents → ORANGE.
    Black tee:  body INK → WHITE,  accents → ORANGE.
    """
    logo_var = {'white': 'light', 'black': 'dark'}[tee_color]
    s = orange_svg

    # 1. Swap chapter logo paths to the right brand variant.
    new_inner = logo_inner(logo_var)
    s = re.sub(
        r'(<svg[^>]*viewBox="0 0 3400 929"[^>]*>)(.*?)(</svg>)',
        lambda m: m.group(1) + '\n' + new_inner + '\n' + m.group(3),
        s, count=1, flags=re.DOTALL,
    )

    # 2. Body <text> fill: INK → WHITE on black tee. White tee keeps INK.
    if tee_color == 'black':
        s = re.sub(
            r'(<text\b[^>]*?fill=)"#111111"',
            lambda m: m.group(1) + f'"{WHITE}"',
            s,
        )

    # 3. Accent <tspan> fill: WHITE → ORANGE on both tees.
    s = re.sub(
        r'(<tspan class="accent"[^>]*?fill=)"#FFFFFF"',
        lambda m: m.group(1) + f'"{ORANGE}"',
        s,
    )
    return s


def main():
    orange_svg = (DESIGN / 'design.es.svg').read_text()
    for tee in ('white', 'black'):
        out = DESIGN / f'design.es.{tee}.svg'
        out.write_text(build_variant(orange_svg, tee))
        print(f'  wrote {out.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
