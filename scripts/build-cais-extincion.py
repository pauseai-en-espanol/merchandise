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


def logo_inner(variant, lang='es'):
    """ES → chapter logo (viewBox 3400×929). EN → global logo
    (1280×449 orange/dark, 1331×449 light)."""
    prefix = 'pauseai-es' if lang == 'es' else 'pauseai-global'
    s = (ROOT / f'brand/logos/{prefix}-on-{variant}.svg').read_text()
    vb_alts = '0 0 3400 929' if lang == 'es' else '33 0 1214 449|0 0 1331 449'
    m = re.search(r'<svg[^>]*viewBox="(?:' + vb_alts + r')"[^>]*>(.*?)</svg>',
                  s, re.DOTALL)
    return m.group(1).strip()


def build_variant(orange_svg, tee_color, lang='es'):
    logo_var = {'white': 'light', 'black': 'dark'}[tee_color]
    s = orange_svg

    # 1. Swap inlined logo for this language/variant.
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

    # 2. Body groups: <g> with fill="#111111" stays INK on white tee,
    #    becomes WHITE on black tee.
    if tee_color == 'black':
        s = re.sub(
            r'(<g\b[^>]*?fill=)"#111111"',
            lambda m: m.group(1) + f'"{WHITE}"',
            s,
        )

    # 3. Accent elements: WHITE → ORANGE on white/black tees.
    #    Covers <text class="accent" fill=…>, <tspan class="accent" fill=…>,
    #    and <line class="accent" stroke=…> (the grid divider rules).
    #    Two passes for class-before / class-after attribute orderings.
    s = re.sub(
        r'(<(?:text|tspan)\b[^>]*?\bclass="accent"[^>]*?\bfill=)"#FFFFFF"',
        lambda m: m.group(1) + f'"{ORANGE}"',
        s,
    )
    s = re.sub(
        r'(<(?:text|tspan)\b[^>]*?\bfill=)"#FFFFFF"([^>]*?\bclass="accent")',
        lambda m: m.group(1) + f'"{ORANGE}"' + m.group(2),
        s,
    )
    s = re.sub(
        r'(<line\b[^>]*?\bclass="accent"[^>]*?\bstroke=)"#FFFFFF"',
        lambda m: m.group(1) + f'"{ORANGE}"',
        s,
    )
    s = re.sub(
        r'(<line\b[^>]*?\bstroke=)"#FFFFFF"([^>]*?\bclass="accent")',
        lambda m: m.group(1) + f'"{ORANGE}"' + m.group(2),
        s,
    )
    return s


def main():
    for lang in ('es', 'en'):
        canon = DESIGN / f'{lang}.orange.front.svg'
        if not canon.exists():
            print(f'  (skip {lang}: {canon.name} not present)')
            continue
        canonical = canon.read_text()
        for tee in ('white', 'black'):
            out = DESIGN / f'{lang}.{tee}.front.svg'
            out.write_text(build_variant(canonical, tee, lang))
            print(f'  wrote {out.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
