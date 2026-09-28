"""
Shared per-tee colour swap for designs that follow the standard chapter rule.

Given the canonical orange-tee front, produce the white- and black-tee
variants:

  Tee      Logo variant   Body (#111111)   Accent (class="accent", #FFFFFF)
  orange   on-orange      INK              WHITE        (canonical, as authored)
  white    on-light       INK              ORANGE
  black    on-dark        WHITE            ORANGE

- Accent = any element carrying class="accent" with fill or stroke #FFFFFF
  (text, tspans, rects, strokes such as a tick or a trend line).
- Body = every fill/stroke #111111, EXCEPT on elements carrying
  class="keep" (e.g. a pupil inside a white eye), which stay ink on every
  tee. Only flipped on the black tee.
- Anything else (spot colours, white eye fills without class="accent",
  PauseAI-orange details) is left untouched.
- The inlined logo is swapped wholesale first: the ES chapter logo
  (viewBox 0 0 3400 929) or the EN global logo (viewBox 33 0 1214 449). The
  on-light / on-dark brand files carry no #111111 (on-dark) and no
  class="accent", so the global swaps never corrupt them.

Per-design builders call build(slug); see scripts/build-<slug>.py.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

ORANGE = '#FF9416'
WHITE = '#FFFFFF'
INK = '#111111'

LOGO = {
    'es': ('pauseai-es', '0 0 3400 929', '0 0 3400 929'),
    'en': ('pauseai-global', '33 0 1214 449|0 0 1331 449', '33 0 1214 449'),
}


def _logo_inner(variant, lang):
    prefix, vb_alts, _ = LOGO[lang]
    s = (ROOT / f'brand/logos/{prefix}-on-{variant}.svg').read_text()
    m = re.search(r'<svg[^>]*viewBox="(?:' + vb_alts + r')"[^>]*>(.*?)</svg>',
                  s, re.DOTALL)
    return m.group(1).strip()


def _swap_logo(s, variant, lang):
    vb = LOGO[lang][2]
    inner = _logo_inner(variant, lang)
    pattern = r'(<svg[^>]*?)viewBox="' + re.escape(vb) + r'"([^>]*>)(.*?)(</svg>)'
    s, n = re.subn(pattern,
                   lambda m: m.group(1) + f'viewBox="{vb}"' + m.group(2)
                   + '\n' + inner + '\n' + m.group(4),
                   s, count=1, flags=re.DOTALL)
    assert n == 1, f'inlined {lang} logo (viewBox {vb}) not found'
    return s


def variant(canonical, tee, lang):
    s = _swap_logo(canonical, {'white': 'light', 'black': 'dark'}[tee], lang)

    def recolour(m):
        tag = m.group(0)
        if tag.startswith('<!') or tag.startswith('<?'):
            return tag
        if 'class="accent"' in tag:
            tag = (tag.replace(f'fill="{WHITE}"', f'fill="{ORANGE}"')
                      .replace(f'stroke="{WHITE}"', f'stroke="{ORANGE}"'))
        if tee == 'black' and 'class="keep"' not in tag:
            tag = (tag.replace(f'fill="{INK}"', f'fill="{WHITE}"')
                      .replace(f'stroke="{INK}"', f'stroke="{WHITE}"'))
        return tag

    return re.sub(r'<[^>]+>', recolour, s)


def build(slug):
    design = ROOT / 'designs' / slug
    for lang in ('es', 'en'):
        canon = design / f'{lang}.orange.front.svg'
        if not canon.exists():
            print(f'  (skip {lang}: {canon.name} not present)')
            continue
        src = canon.read_text()
        for tee in ('white', 'black'):
            out = design / f'{lang}.{tee}.front.svg'
            out.write_text(variant(src, tee, lang))
            print(f'  wrote {out.relative_to(ROOT)}')
