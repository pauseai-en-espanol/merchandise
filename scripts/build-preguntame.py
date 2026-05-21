#!/usr/bin/env python3
"""
Rebuild designs/preguntame/design.es.{orange,white,black}.svg with the
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


def logo_inner(variant, lang='es'):
    """ES → chapter logo (3400×929). EN → global logo (1280×449 for
    orange/dark, 1331×449 for light)."""
    prefix = 'pauseai-es' if lang == 'es' else 'pauseai-global'
    s = (ROOT / f'brand/logos/{prefix}-on-{variant}.svg').read_text()
    vb_alts = '0 0 3400 929' if lang == 'es' else '33 0 1214 449|0 0 1331 449'
    m = re.search(r'<svg[^>]*viewBox="(?:' + vb_alts + r')"[^>]*>(.*?)</svg>',
                  s, re.DOTALL)
    return m.group(1).strip()


def build_variant(orange_svg, tee_color, lang='es'):
    """Per-tee colour rules (same for ES and EN)."""
    logo_var = {'white': 'light', 'black': 'dark'}[tee_color]
    s = orange_svg

    # 1. Swap inlined logo to the right brand variant.
    new_inner = logo_inner(logo_var, lang)
    if lang == 'es':
        vb_old, vb_new = '0 0 3400 929', '0 0 3400 929'
    else:
        vb_old = '33 0 1214 449'
        vb_new = '33 0 1214 449'
    pattern = r'(<svg[^>]*?)viewBox="' + re.escape(vb_old) + r'"([^>]*>)(.*?)(</svg>)'
    s = re.sub(
        pattern,
        lambda m: m.group(1) + f'viewBox="{vb_new}"' + m.group(2)
                  + '\n' + new_inner + '\n' + m.group(4),
        s, count=1, flags=re.DOTALL,
    )

    # 2. Body <text> fill: INK → WHITE on black tee.
    if tee_color == 'black':
        s = re.sub(
            r'(<text\b[^>]*?fill=)"#111111"',
            lambda m: m.group(1) + f'"{WHITE}"',
            s,
        )

    # 3. Accent <tspan> fill: WHITE → ORANGE on white/black tees.
    s = re.sub(
        r'(<tspan class="accent"[^>]*?fill=)"#FFFFFF"',
        lambda m: m.group(1) + f'"{ORANGE}"',
        s,
    )
    return s


def main():
    for lang in ('es', 'en'):
        canon = DESIGN / f'{lang}.orange.front.svg'
        if not canon.exists():
            print(f'  (skip {lang}: {canon.name} not present)')
            continue
        orange_svg = canon.read_text()
        for tee in ('white', 'black'):
            out = DESIGN / f'{lang}.{tee}.front.svg'
            out.write_text(build_variant(orange_svg, tee, lang))
            print(f'  wrote {out.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
