#!/usr/bin/env python3
"""
Rebuild designs/shoggoth-cara-amable/{lang}.{white,black}.front.svg from the
canonical orange-tee front.

The creature is a black LINE drawing with two constant spot-colour fills —
the pink ajuste-fino mask and the yellow RLHF smiley (see brand/tokens.json
→ illustrationColors). Those two fills are CONSTANT on every tee; the builder
never touches them (they aren't #111111 or #FFFFFF, so the swaps below skip
them). Handles both ES (es.*) and EN (en.*) canonicals.

Per-tee rule (only the ink linework/text and the headline accent move):

  Canonical (orange tee):  body INK,   accent WHITE   (TRAS / AMABLE / IA)
  White tee:               body INK,   accent ORANGE
  Black tee:               body WHITE,  accent ORANGE

Accent = anything carrying class="accent" fill="#FFFFFF" (the highlighted
headline words — ES: TRAS / AMABLE / IA, EN: BEHIND / FRIENDLY / AI),
recoloured to PauseAI orange off the orange tee.

Body = every ink mark: the traced creature linework (<g id="shoggoth-ink">,
which includes the mask's grimace and the smiley's eyes/smile drawn on top of
the colour fills), the phrase, the three stage labels, their arrows
(fill + stroke), and the credit line. On the black tee these all flip
ink -> paper, so the swap covers BOTH fill="#111111" and stroke="#111111".

The inlined logo is swapped wholesale to the on-light / on-dark brand
variant first; those variants contain no #111111 (on-dark) and carry no
class="accent" (both), so the global body/accent swaps never corrupt them.

Run AFTER scripts/build-qr.py. Run from the repo root:
    python3 scripts/build-shoggoth-cara-amable.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DESIGN = ROOT / 'designs/shoggoth-cara-amable'

ORANGE = '#FF9416'
WHITE = '#FFFFFF'
INK = '#111111'


def logo_inner(variant, lang='es'):
    """ES → chapter logo (viewBox 3400×929). EN → global logo."""
    prefix = 'pauseai-es' if lang == 'es' else 'pauseai-global'
    s = (ROOT / f'brand/logos/{prefix}-on-{variant}.svg').read_text()
    vb_alts = '0 0 3400 929' if lang == 'es' else '33 0 1214 449|0 0 1331 449'
    m = re.search(r'<svg[^>]*viewBox="(?:' + vb_alts + r')"[^>]*>(.*?)</svg>',
                  s, re.DOTALL)
    return m.group(1).strip()


def build_variant(orange_svg, tee_color, lang='es'):
    logo_var = {'white': 'light', 'black': 'dark'}[tee_color]
    s = orange_svg

    # 1. Swap the inlined logo for this language/variant.
    new_inner = logo_inner(logo_var, lang)
    vb = '0 0 3400 929' if lang == 'es' else '33 0 1214 449'
    pattern = (r'(<svg[^>]*?)viewBox="' + re.escape(vb)
               + r'"([^>]*>)(.*?)(</svg>)')
    s = re.sub(
        pattern,
        lambda m: m.group(1) + f'viewBox="{vb}"' + m.group(2)
                  + '\n' + new_inner + '\n' + m.group(4),
        s, count=1, flags=re.DOTALL,
    )

    # 2. Accent (class="accent"): WHITE → ORANGE on white & black tees.
    #    Two passes cover class-before-fill and fill-before-class orderings.
    s = re.sub(r'(class="accent"[^>]*?\bfill=)"#FFFFFF"',
               lambda m: m.group(1) + f'"{ORANGE}"', s)
    s = re.sub(r'(\bfill=)"#FFFFFF"([^>]*?class="accent")',
               lambda m: m.group(1) + f'"{ORANGE}"' + m.group(2), s)

    # 3. Body: INK → PAPER on the black tee only (fill AND stroke).
    #    Safe: the on-dark logo carries no #111111, and the accent fills are
    #    #FFFFFF (already handled in step 2), so nothing else is affected.
    if tee_color == 'black':
        s = s.replace(f'fill="{INK}"', f'fill="{WHITE}"')
        s = s.replace(f'stroke="{INK}"', f'stroke="{WHITE}"')

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
