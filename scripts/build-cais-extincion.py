#!/usr/bin/env python3
"""
Rebuild designs/cais-extincion/design.es.{white,black}.svg.

Per-tee rule (matches the rest of the chapter activist set):

  Canonical (orange tee):  body INK, footer accent WHITE
  White tee:               body INK, footer accent ORANGE
  Black tee:               body WHITE, footer accent ORANGE

Run AFTER scripts/build-qr.py (which generates the back.* variants);
this script handles design.es.{white,black}.svg.

Run from the repo root:
    python3 scripts/build-cais-extincion.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DESIGN = ROOT / 'designs/cais-extincion'

ORANGE = '#FF9416'
WHITE = '#FFFFFF'
INK = '#111111'


def logo_inner(variant):
    s = (ROOT / f'brand/logos/pauseai-es-on-{variant}.svg').read_text()
    m = re.search(r'<svg[^>]*viewBox="0 0 3400 929"[^>]*>(.*?)</svg>',
                  s, re.DOTALL)
    return m.group(1).strip()


def build_variant(orange_svg, tee_color):
    logo_var = {'white': 'light', 'black': 'dark'}[tee_color]
    s = orange_svg

    # 1. Swap the inlined chapter logo to the right brand variant.
    new_inner = logo_inner(logo_var)
    s = re.sub(
        r'(<svg[^>]*viewBox="0 0 3400 929"[^>]*>)(.*?)(</svg>)',
        lambda m: m.group(1) + '\n' + new_inner + '\n' + m.group(3),
        s, count=1, flags=re.DOTALL,
    )

    # 2. Body groups: <g> with fill="#111111" stays INK on white tee,
    #    becomes WHITE on black tee.
    if tee_color == 'black':
        s = re.sub(
            r'(<g\b[^>]*?fill=)"#111111"',
            lambda m: m.group(1) + f'"{WHITE}"',
            s,
        )

    # 3. Accent <tspan class="accent">: WHITE → ORANGE on white/black tees.
    #    (Words EXTINCIÓN and PRIORIDAD GLOBAL in the quote.)
    s = re.sub(
        r'(<tspan class="accent"[^>]*?fill=)"#FFFFFF"',
        lambda m: m.group(1) + f'"{ORANGE}"',
        s,
    )
    return s


def main():
    canonical = (DESIGN / 'design.es.svg').read_text()
    for tee in ('white', 'black'):
        out = DESIGN / f'design.es.{tee}.svg'
        out.write_text(build_variant(canonical, tee))
        print(f'  wrote {out.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
