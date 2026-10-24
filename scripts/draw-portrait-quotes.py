#!/usr/bin/env python3
"""
Generate the canonical fronts ({es,en}.orange.front.svg) of the portrait-quote
series: one tee per person, with LOB LAN's hand-drawn portrait from
illustrations/portraits/<person>/ next to a verbatim quote.

Every tee in the series shares one layout (200 × 200 mm canvas):

    y=15..63    logo
    y=72..190   portrait (left, bottom-aligned, right edge at x=96)
                | quote column (right, x 101..194): an optional lead-in
                  line, the quote as a justified stack whose payoff lines
                  are the accent, then the attribution, bottom-aligned
                  with the portrait

The portrait is the one-ink line version (lines.svg), inlined unmodified
as plain body ink in a <g id="portrait"> slot: ink on the orange and white
tees, white on the black one (a negative, see
illustrations/portraits/README.md). The web generator can swap the halftone
or tone version into the same slot; each design.json names its portrait so
it knows which (packages/core/src/portrait.ts).

Quotes, sources and our Spanish translations are documented in each
design's README; edit the text here, then re-run. Stdlib + fontTools:
    python3 scripts/draw-portrait-quotes.py [slug ...]
"""
import re
import sys
from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent

F = 'font-family="Saira Condensed, Impact, sans-serif" font-weight="700"'
INK, WHITE = '#111111', '#FFFFFF'

_font = TTFont(str(ROOT / 'brand/fonts/files/SairaCondensed-Bold.ttf'))
_cmap, _hmtx = _font.getBestCmap(), _font['hmtx']
_upm = _font['head'].unitsPerEm
CAP = _font['OS/2'].sCapHeight / _upm


def adv(s):
    return sum(_hmtx[_cmap[ord(c)]][0] for c in s) / _upm


# --- layout (mm) ------------------------------------------------------------

PORTRAIT_R, PORTRAIT_BOTTOM = 96, 190
PORTRAIT_MAX_W, PORTRAIT_MAX_H = 90, 118
COL_X, COL_W = 101, 93
TOP, BOTTOM = 72, 190
SETUP_MAX = 13.5               # setup lines never grow past this size
LEAD_SIZE = 4.6                # italic lead-in above the quote
NAME_SIZE = 8.5
SUB_SIZE = 3.8                 # italic credential / source lines
ATTR_GAP = 7                   # quote → attribution


# --- the series -------------------------------------------------------------
#
# setup: quote lines in the body colour; payoff: the accent lines.
# lead: optional context line set outside the quote marks.
# sub: attribution lines under the name (wrapped to the column).

DESIGNS = {
    'hawking-end-of-the-human-race': dict(
        person='hawking',
        lane='A (a calm, historic warning from a world-famous physicist)',
        es=dict(
            title='El desarrollo de una inteligencia artificial completa podría '
                  'significar el fin de la raza humana. — Stephen Hawking',
            setup=['«EL DESARROLLO DE UNA', 'INTELIGENCIA ARTIFICIAL',
                   'COMPLETA PODRÍA SIGNIFICAR'],
            payoff=['EL FIN DE LA', 'RAZA HUMANA.»'],
            name='STEPHEN HAWKING',
            sub=['Físico teórico, Universidad de Cambridge',
                 'Entrevista en la BBC, 2 de diciembre de 2014',
                 'Traducción PauseAI en Español']),
        en=dict(
            title='The development of full artificial intelligence could spell '
                  'the end of the human race. — Stephen Hawking',
            setup=['“THE DEVELOPMENT OF FULL', 'ARTIFICIAL INTELLIGENCE',
                   'COULD SPELL'],
            payoff=['THE END OF', 'THE HUMAN RACE.”'],
            name='STEPHEN HAWKING',
            sub=['Theoretical physicist, University of Cambridge',
                 'BBC interview, 2 December 2014']),
    ),
    'russell-russian-roulette': dict(
        person='russell',
        lane='B (accountability: a leading AI scientist on the AI companies)',
        es=dict(
            title='Están jugando a la ruleta rusa con cada ser humano de la Tierra, '
                  'sin nuestro permiso. — Stuart Russell',
            lead='Sobre los líderes de las empresas de IA:',
            setup=['«ESTÁN JUGANDO A LA'],
            payoff=['RULETA RUSA'],
            setup2=['CON CADA SER HUMANO', 'DE LA TIERRA,'],
            payoff2=['SIN NUESTRO', 'PERMISO.»'],
            name='STUART RUSSELL',
            sub=['Catedrático de Informática, UC Berkeley',
                 '«The Diary of a CEO», 4 de diciembre de 2025',
                 'Traducción PauseAI en Español']),
        en=dict(
            title='They are playing Russian roulette with every human being on '
                  'Earth, without our permission. — Stuart Russell',
            lead='On the heads of the AI companies:',
            setup=['“THEY ARE PLAYING'],
            payoff=['RUSSIAN ROULETTE'],
            setup2=['WITH EVERY HUMAN', 'BEING ON EARTH,'],
            payoff2=['WITHOUT OUR', 'PERMISSION.”'],
            name='STUART RUSSELL',
            sub=['Professor of Computer Science, UC Berkeley',
                 '“The Diary of a CEO”, 4 December 2025']),
    ),
    'coxon-kill-us-all': dict(
        person='coxon',
        lane='B (accountability: a researcher who quit two frontier labs)',
        es=dict(
            title='Quienes construyen la IA creen sinceramente que podría matarnos '
                  'a todos antes de que acabe la década. — Jacob Coxon',
            setup=['«QUIENES CONSTRUYEN', 'LA IA CREEN', 'SINCERAMENTE QUE', 'PODRÍA'],
            payoff=['MATARNOS', 'A TODOS'],
            setup2=['ANTES DE QUE', 'ACABE LA DÉCADA.»'],
            name='JACOB COXON',
            sub=['Ex-investigador de OpenAI y Anthropic',
                 'Hilo en X al dimitir, 8 de septiembre de 2026',
                 'Traducción PauseAI en Español']),
        en=dict(
            title='The people building AI earnestly believe that it could kill us '
                  'all by the end of the decade. — Jacob Coxon',
            setup=['“THE PEOPLE BUILDING', 'AI EARNESTLY', 'BELIEVE THAT', 'IT COULD'],
            payoff=['KILL US ALL'],
            setup2=['BY THE END OF', 'THE DECADE.”'],
            name='JACOB COXON',
            sub=['Former OpenAI and Anthropic researcher',
                 'Resignation thread on X, 8 September 2026']),
    ),
    'hinton-tiger-cub': dict(
        person='hinton',
        lane='A (a Nobel laureate’s metaphor; invites reflection)',
        es=dict(
            title='Somos como alguien que tiene un cachorro de tigre muy mono. […] '
                  'A menos que puedas estar muy seguro de que no va a querer matarte '
                  'cuando crezca, deberías preocuparte. — Geoffrey Hinton',
            setup=['«SOMOS COMO ALGUIEN', 'QUE TIENE UN'],
            payoff=['CACHORRO DE', 'TIGRE MUY MONO.'],
            setup2=['[…] A MENOS QUE PUEDAS', 'ESTAR MUY SEGURO DE QUE',
                    'NO VA A QUERER MATARTE', 'CUANDO CREZCA,'],
            payoff2=['DEBERÍAS', 'PREOCUPARTE.»'],
            name='GEOFFREY HINTON',
            sub=['Premio Nobel de Física 2024',
                 'Entrevista en CBS News, 26 de abril de 2025',
                 'Traducción PauseAI en Español']),
        en=dict(
            title='We’re like somebody who has this really cute tiger cub. … Unless '
                  'you can be very sure that it’s not going to want to kill you when '
                  'it’s grown up, you should worry. — Geoffrey Hinton',
            setup=['“WE’RE LIKE SOMEBODY', 'WHO HAS THIS'],
            payoff=['REALLY CUTE', 'TIGER CUB.'],
            setup2=['… UNLESS YOU CAN BE', 'VERY SURE THAT IT’S NOT',
                    'GOING TO WANT TO KILL', 'YOU WHEN IT’S GROWN UP,'],
            payoff2=['YOU SHOULD', 'WORRY.”'],
            name='GEOFFREY HINTON',
            sub=['2024 Nobel Prize in Physics',
                 'CBS News interview, 26 April 2025']),
    ),
    'hawking-superseded': dict(
        person='hawking',
        lane='A (a calm, historic warning from a world-famous physicist)',
        es=dict(
            title='Los humanos, limitados por la lenta evolución biológica, no podrían '
                  'competir y serían reemplazados. — Stephen Hawking',
            setup=['«LOS HUMANOS,', 'LIMITADOS POR LA LENTA', 'EVOLUCIÓN BIOLÓGICA,',
                   'NO PODRÍAN COMPETIR', 'Y SERÍAN'],
            payoff=['REEMPLAZADOS.»'],
            name='STEPHEN HAWKING',
            sub=['Físico teórico, Universidad de Cambridge',
                 'Entrevista en la BBC, 2 de diciembre de 2014',
                 'Traducción PauseAI en Español']),
        en=dict(
            title='Humans, who are limited by slow biological evolution, couldn’t compete, '
                  'and would be superseded. — Stephen Hawking',
            setup=['“HUMANS, WHO ARE', 'LIMITED BY SLOW', 'BIOLOGICAL EVOLUTION,',
                   'COULDN’T COMPETE,', 'AND WOULD BE'],
            payoff=['SUPERSEDED.”'],
            name='STEPHEN HAWKING',
            sub=['Theoretical physicist, University of Cambridge',
                 'BBC interview, 2 December 2014']),
    ),
    'russell-best-case-scenario': dict(
        person='russell',
        lane='B (accountability: what a leading AI CEO told a leading AI scientist)',
        es=dict(
            title='Veía este desastre a escala de Chernóbil como el mejor escenario '
                  'posible, porque entonces los gobiernos regularían. — Stuart Russell',
            lead='Sobre el director de una gran empresa de IA:',
            setup=['«…VEÍA ESTE DESASTRE', 'A ESCALA DE CHERNÓBIL', 'COMO'],
            payoff=['EL MEJOR', 'ESCENARIO POSIBLE,'],
            setup2=['PORQUE ENTONCES', 'LOS GOBIERNOS', 'REGULARÍAN…»'],
            name='STUART RUSSELL',
            sub=['Catedrático de Informática, UC Berkeley',
                 '«The Diary of a CEO», 4 de diciembre de 2025',
                 'Traducción PauseAI en Español']),
        en=dict(
            title='He looked at this Chernobyl-scale disaster as the best case scenario, '
                  'because then the governments would regulate. — Stuart Russell',
            lead='On the head of a leading AI company:',
            setup=['“…HE LOOKED AT THIS', 'CHERNOBYL-SCALE', 'DISASTER AS'],
            payoff=['THE BEST CASE', 'SCENARIO,'],
            setup2=['BECAUSE THEN THE', 'GOVERNMENTS WOULD', 'REGULATE…”'],
            name='STUART RUSSELL',
            sub=['Professor of Computer Science, UC Berkeley',
                 '“The Diary of a CEO”, 4 December 2025']),
    ),
    'coxon-gambling-with-our-lives': dict(
        person='coxon',
        lane='B (accountability: a researcher who quit two frontier labs)',
        es=dict(
            title='Corren directas hacia una superinteligencia que se mejora a sí misma y '
                  'se están jugando nuestras vidas. — Jacob Coxon',
            lead='Sobre OpenAI y Anthropic:',
            setup=['«CORREN DIRECTAS HACIA', 'UNA SUPERINTELIGENCIA', 'QUE SE MEJORA',
                   'A SÍ MISMA Y SE ESTÁN'],
            payoff=['JUGANDO', 'NUESTRAS VIDAS.»'],
            name='JACOB COXON',
            sub=['Ex-investigador de OpenAI y Anthropic',
                 'Hilo en X al dimitir, 8 de septiembre de 2026',
                 'Traducción PauseAI en Español']),
        en=dict(
            title='They are racing straight to self-improving superintelligence and '
                  'gambling with our lives. — Jacob Coxon',
            lead='On OpenAI and Anthropic:',
            setup=['“THEY ARE RACING', 'STRAIGHT TO', 'SELF-IMPROVING',
                   'SUPERINTELLIGENCE AND'],
            payoff=['GAMBLING WITH', 'OUR LIVES.”'],
            name='JACOB COXON',
            sub=['Former OpenAI and Anthropic researcher',
                 'Resignation thread on X, 8 September 2026']),
    ),
    'hinton-less-intelligent-things': dict(
        person='hinton',
        lane='A (a Nobel laureate’s question; invites reflection)',
        es=dict(
            title='¿Cuántos ejemplos conoces de cosas menos inteligentes que controlen a '
                  'cosas mucho más inteligentes? — Geoffrey Hinton',
            setup=['«…¿CUÁNTOS EJEMPLOS', 'CONOCES DE COSAS', 'MENOS INTELIGENTES',
                   'QUE CONTROLEN A'],
            payoff=['COSAS MUCHO MÁS', 'INTELIGENTES?»'],
            name='GEOFFREY HINTON',
            sub=['Premio Nobel de Física 2024',
                 'Entrevista en CBS News, 26 de abril de 2025',
                 'Traducción PauseAI en Español']),
        en=dict(
            title='How many examples do you know of less intelligent things controlling '
                  'much more intelligent things? — Geoffrey Hinton',
            setup=['“…HOW MANY EXAMPLES', 'DO YOU KNOW OF LESS', 'INTELLIGENT THINGS',
                   'CONTROLLING'],
            payoff=['MUCH MORE INTELLIGENT', 'THINGS?”'],
            name='GEOFFREY HINTON',
            sub=['2024 Nobel Prize in Physics',
                 'CBS News interview, 26 April 2025']),
    ),
    'bengio-losing-control': dict(
        person='bengio',
        lane='B (accountability: the companies themselves say it is too fast)',
        es=dict(
            title='Hay una razón por la que las empresas dicen que esto va demasiado '
                  'rápido, que estamos perdiendo el control. — Yoshua Bengio',
            setup=['«HAY UNA RAZÓN', 'POR LA QUE LAS', 'EMPRESAS DICEN QUE',
                   'ESTO VA DEMASIADO', 'RÁPIDO, QUE'],
            payoff=['ESTAMOS', 'PERDIENDO', 'EL CONTROL.»'],
            name='YOSHUA BENGIO',
            sub=['Premio Turing 2018 · Universidad de Montreal',
                 'Entrevista con la AFP, septiembre de 2026',
                 'Traducción PauseAI en Español']),
        en=dict(
            title='There’s a reason that companies are saying this is going too fast, '
                  'that we’re losing control. — Yoshua Bengio',
            setup=['“THERE’S A REASON', 'THAT COMPANIES ARE', 'SAYING THIS IS',
                   'GOING TOO FAST,'],
            payoff=['THAT WE’RE', 'LOSING CONTROL.”'],
            name='YOSHUA BENGIO',
            sub=['2018 Turing Award · Université de Montréal',
                 'Interview with AFP, September 2026']),
    ),
}


# --- portrait -----------------------------------------------------------------

def portrait(person):
    """The person's lines.svg, inlined unmodified and placed by a transform."""
    src = (ROOT / 'illustrations/portraits' / person / 'lines.svg').read_text()
    vw, vh = map(float, re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', src).groups())
    w = min(PORTRAIT_MAX_W, PORTRAIT_MAX_H * vw / vh)
    s = w / vw
    x, y = PORTRAIT_R - w, PORTRAIT_BOTTOM - vh * s
    paths = re.findall(r'<path\b.*?/>', src, re.DOTALL)
    assert paths, f'no paths in {person}/lines.svg'
    body = '\n'.join(f'    {p}' for p in paths)
    return (f'  <g id="portrait" transform="translate({x:.2f} {y:.2f}) scale({s:.5f})">\n'
            f'{body}\n  </g>'), (x, y, w, vh * s)


# --- text -----------------------------------------------------------------------

def wrap(text, size, width):
    words, lines, cur = text.split(' '), [], ''
    for w in words:
        nxt = f'{cur} {w}' if cur else w
        if cur and adv(nxt) * size > width:
            lines.append(cur)
            cur = w
        else:
            cur = nxt
    return lines + [cur]


def attribution(t):
    """(text, size, italic, baseline) rows, bottom-aligned at BOTTOM; returns
    the rows and the top of the name's capitals."""
    subs = [ln for s in t['sub'] for ln in wrap(s, SUB_SIZE, COL_W)]
    rows, y = [], BOTTOM
    for s in reversed(subs):
        rows.append((s, SUB_SIZE, True, y))
        y -= SUB_SIZE * 1.3
    y -= 1.6
    rows.append((t['name'], NAME_SIZE, False, y))
    return rows[::-1], y - NAME_SIZE * CAP


def stack(t, top, bottom):
    """Justified column, as in ask-a-chicken: payoff lines always fill COL_W;
    setup lines fill it unless that would make them larger than SETUP_MAX
    (then left-aligned). Shrinks to fit, centres if there is room to spare."""
    groups = [(t.get('setup', []), False), (t.get('payoff', []), True),
              (t.get('setup2', []), False), (t.get('payoff2', []), True)]
    rows = [(s, acc, gi) for gi, (g, acc) in enumerate(groups) for s in g]

    def layout(k):
        y, out = top, []
        for i, (s, acc, gi) in enumerate(rows):
            sz = COL_W / adv(s) * k
            if not acc:
                sz = min(sz, SETUP_MAX * k)
            if i and any(c in s for c in 'ÁÉÍÓÚÑ'):
                y += sz * 0.16
            if i and gi != rows[i - 1][2]:
                y += 2.0 * k
            y += sz * CAP
            out.append((s, acc, sz, y))
            y += 2.4
        return out, y - 2.4

    k = 1.0
    while layout(k)[1] > bottom:
        k -= 0.005
    out, end = layout(k)
    slack = (bottom - end) / 2
    return [(s, acc, sz, y + slack) for s, acc, sz, y in out]


def front(slug, d, lang, logo):
    t = d[lang]
    art, (px, py, pw, ph) = portrait(d['person'])
    attr, attr_top = attribution(t)
    top = TOP
    lead = ''
    if t.get('lead'):
        lead = (f'\n  <text id="lead" x="{COL_X}" y="{TOP + LEAD_SIZE * CAP:.2f}" {F} '
                f'font-style="italic" font-size="{LEAD_SIZE}" fill="{INK}">{t["lead"]}</text>')
        top = TOP + LEAD_SIZE * CAP + 4
    lines = []
    for s, acc, sz, y in stack(t, top, attr_top - ATTR_GAP):
        fill = 'class="accent" fill="#FFFFFF"' if acc else f'fill="{INK}"'
        lines.append(f'    <text x="{COL_X}" y="{y:.2f}" font-size="{sz:.2f}" {fill}>{s}</text>')
    attr_svg = []
    for i, (s, sz, italic, y) in enumerate(attr):
        gid = 'attribution' if i == 0 else f'attribution-sub-{i}'
        style = ' font-style="italic"' if italic else ''
        attr_svg.append(f'  <text id="{gid}" x="{COL_X}" y="{y:.2f}" {F}{style} '
                        f'font-size="{sz}" fill="{INK}">{s}</text>')
    language = 'Spanish' if lang == 'es' else 'English'
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<!--
  Design: {slug} (chest, {language})
  Voice lane: {d['lane']}
  GENERATED by scripts/draw-portrait-quotes.py — edit there, not here.
  Portrait: illustrations/portraits/{d['person']}/lines.svg by LOB LAN
  (CC BY-SA 4.0, signature kept), inlined unmodified.

  Layout (200 × 200 mm canvas):
    y=15..63    logo
    y={py:.0f}..{py + ph:.0f}   portrait (x {px:.0f}..{px + pw:.0f}, body ink) | quote column
                (x {COL_X}..{COL_X + COL_W}): justified stack, payoff lines are the
                accent; attribution bottom-aligned with the portrait
-->
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 200 200"
     width="200mm" height="200mm"
     role="img"
     aria-label="{t['title']}">
  <title>{t['title']}</title>

{logo}

{art}
{lead}
  <g id="quote" {F}>
{chr(10).join(lines)}
  </g>

{chr(10).join(attr_svg)}
</svg>
'''


def main(slugs):
    for slug in slugs or DESIGNS:
        d = DESIGNS[slug]
        out = ROOT / 'designs' / slug
        out.mkdir(exist_ok=True)
        for lang in ('es', 'en'):
            logo_src = (ROOT / 'designs/turing-1951' / f'{lang}.orange.front.svg').read_text()
            a = logo_src.index('  <svg x=')
            logo = logo_src[a:logo_src.index('</svg>', a) + 6]
            (out / f'{lang}.orange.front.svg').write_text(front(slug, d, lang, logo))
            print(f'  wrote designs/{slug}/{lang}.orange.front.svg')


if __name__ == '__main__':
    main(sys.argv[1:])
