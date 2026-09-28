#!/usr/bin/env python3
"""
Generate designs/crecimiento-exponencial/{es,en}.orange.front.svg.

A linear-scale chart of training compute for notable AI models (Epoch AI
data), with a smooth exponential trend. Only models for which Epoch
publishes a training-compute figure can be plotted (no Claude Opus / Mythos
or GPT-5.1+: Epoch has no estimate for them — see the README).

Data: Epoch AI "Notable AI Models" CSV, retrieved RETRIEVED. Every number
below is copied from that CSV; see the design README for the table. When
refreshing, re-download the CSV, update DATA and RETRIEVED, and
re-run. Stdlib only (plus numpy for the fit).

Trend curve:
  1. slope: least squares on log10(FLOP) vs year over all DATA points
     (the growth rate, printed on the shirt; Epoch's own figure is ×5/yr);
  2. height: with that slope fixed, the scale factor that best fits the
     points' actual (linear) values. So the curve follows the part of the
     chart the eye actually sees — the recent frontier — instead of being
     dominated by the near-zero early models.

    python3 scripts/draw-crecimiento.py
"""
import math
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
DESIGN = ROOT / 'designs/crecimiento-exponencial'
RETRIEVED = '2026-09-28'

F = 'font-family="Saira Condensed, Impact, sans-serif" font-weight="700"'
INK, WHITE = '#111111', '#FFFFFF'

# (name, date, training FLOP, Epoch estimate?, label placement)
DATA = [
    ('AlexNet',           '2012-09-30', 4.7e17,    False, 'up'),
    ('GPT-2',             '2019-02-14', 1.92e21,   True,  None),
    ('GPT-3',             '2020-05-28', 3.14e23,   False, 'up'),
    ('PaLM',              '2022-04-04', 2.5272e24, False, None),
    ('GPT-4',             '2023-03-15', 2.1e25,    True,  'up'),
    ('Gemini 1.0 Ultra',  '2023-12-06', 5.0e25,    True,  None),
    ('Llama 3.1-405B',    '2024-07-23', 3.8e25,    False, None),
    ('GPT-4.5',           '2025-02-27', 3.8e26,    True,  'left'),
    ('Grok 4',            '2025-07-09', 5.0e26,    True,  'left'),
    ('GPT-6 Astra',       '2026-09-03', 1.0e27,    True,  'left'),
]
TXT = {
    'es': dict(
        title='×5 cada año: crece la computación para entrenar los modelos '
              'de lenguaje de frontera (Epoch AI).',
        h='CADA AÑO',
        sub=['crece la computación usada para entrenar',
             'los modelos de lenguaje de frontera (desde 2020)'],
        axis='Computación usada para entrenar cada modelo (escala lineal)',
        trend=('tendencia exponencial', '(×{r} al año, ajuste a estos modelos)'),
        leg=('dato publicado', 'estimación de Epoch'),
        src='Fuente: Epoch AI, «Trends in AI» (feb. 2026) y «Notable AI '
            'Models» (consulta 28/09/2026).'),
    'en': dict(
        title='5× per year: training compute for frontier language models '
              '(Epoch AI).',
        h='EVERY YEAR',
        sub=['growth in the compute used to train',
             'frontier language models (since 2020)'],
        axis='Compute used to train each model (linear scale)',
        trend=('exponential trend', '({r}× per year, fitted to these models)'),
        leg=('reported value', 'Epoch estimate'),
        src='Source: Epoch AI, “Trends in AI” (Feb 2026) and “Notable AI '
            'Models” (retrieved 2026-09-28).'),
}


def year(d):
    y, m, dd = map(int, d.split('-'))
    return y + (m - 1) / 12 + (dd - 1) / 365


# --- geometry ---------------------------------------------------------------
X0, X1 = 22, 182            # plot x extent
YB, YT = 170, 112           # baseline / top of the tallest value
# broken time axis: [2012, 2013.6] | break | [2018, 2027]
SEG_A = (2012.0, 2013.6, X0, X0 + 11)
BREAK = (X0 + 11, X0 + 16)
SEG_B = (2018.0, 2027.0, X0 + 16, X1)


def px(yr):
    for t0, t1, x0, x1 in (SEG_A, SEG_B):
        if t0 <= yr <= t1:
            return x0 + (yr - t0) * (x1 - x0) / (t1 - t0)
    return None                 # inside the break


def fit():
    t = np.array([year(d) for _, d, *_ in DATA])
    f = np.array([v for _, _, v, *_ in DATA])
    b, _ = np.polyfit(t, np.log10(f), 1)
    g = 10 ** (b * (t - 2026.67))
    A = (f * g).sum() / (g * g).sum()
    return 10 ** b, (lambda yr: A * 10 ** (b * (yr - 2026.67)))


def build(lang, rate, trend):
    t = TXT[lang]
    ymax = max(trend(2026.67), max(v for _, _, v, *_ in DATA)) * 1.04
    py = lambda v: YB - v / ymax * (YB - YT)

    out = []
    # axis + years + break marks
    ax = [f'    <line x1="{X0}" y1="{YB}" x2="{BREAK[0]:.2f}" y2="{YB}" stroke="{INK}" stroke-width="0.7"/>',
          f'    <line x1="{BREAK[1]:.2f}" y1="{YB}" x2="{X1}" y2="{YB}" stroke="{INK}" stroke-width="0.7"/>']
    for bx in BREAK:
        ax.append(f'    <line x1="{bx - 1:.2f}" y1="{YB + 1.8}" x2="{bx + 1:.2f}" y2="{YB - 1.8}" stroke="{INK}" stroke-width="0.6"/>')
    for yr in (2012, 2018, 2020, 2022, 2024, 2026):
        ax.append(f'    <text x="{px(yr):.2f}" y="{YB + 5.6}" font-size="4.2" text-anchor="middle">{yr}</text>')
    ax.append(f'    <text x="{X0}" y="106" font-size="4.2" font-style="italic">{t["axis"]}</text>')
    out.append(f'  <g id="axes" {F} fill="{INK}">\n' + '\n'.join(ax) + '\n  </g>')

    # trend curve (two pieces around the break)
    pieces = []
    for t0, t1, *_ in (SEG_A, (SEG_B[0], 2026.67)):
        ts = np.linspace(t0, t1, 160)
        pieces.append('M ' + ' L '.join(f'{px(x):.2f} {py(trend(x)):.2f}' for x in ts))
    out.append(f'  <path id="trend" class="accent" d="{" ".join(pieces)}" fill="none" '
               f'stroke="{WHITE}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>')
    r = f'{rate:.1f}'.replace('.', ',') if lang == 'es' else f'{rate:.1f}'

    # points + labels
    dots, labs = [], []
    for name, d, v, est, lab in DATA:
        x, y = px(year(d)), py(v)
        dots.append(f'    <circle cx="{x:.2f}" cy="{y:.2f}" r="1.8" fill="none" stroke="{INK}" stroke-width="0.8"/>' if est
                    else f'    <circle cx="{x:.2f}" cy="{y:.2f}" r="2.0" fill="{INK}"/>')
        if lab == 'up':
            labs.append(f'    <text x="{x:.2f}" y="{y - 3.6:.2f}" font-size="4.4" text-anchor="middle">{name}</text>')
        elif lab == 'right':
            labs.append(f'    <text x="{x + 3:.2f}" y="{y + 1.5:.2f}" font-size="4.4">{name}</text>')
        elif lab == 'left':
            labs.append(f'    <text x="{x - 3:.2f}" y="{y + 1.5:.2f}" font-size="4.4" text-anchor="end">{name}</text>')
    out.append('  <g id="points">\n' + '\n'.join(dots) + '\n  </g>')
    out.append(f'  <g id="point-labels" {F} fill="{INK}">\n' + '\n'.join(labs) + '\n  </g>')

    # legend
    out.append(f'''  <g id="legend" {F} font-size="4.2" fill="{INK}">
    <circle cx="{X0 + 2.5}" cy="114" r="2.0" fill="{INK}"/>
    <text x="{X0 + 6.5}" y="115.5">{t["leg"][0]}</text>
    <circle cx="{X0 + 2.5}" cy="120.5" r="1.8" fill="none" stroke="{INK}" stroke-width="0.8"/>
    <text x="{X0 + 6.5}" y="122">{t["leg"][1]}</text>
    <line class="accent" x1="{X0}" y1="127" x2="{X0 + 5}" y2="127" stroke="{WHITE}" stroke-width="1.6" stroke-linecap="round"/>
    <text x="{X0 + 6.5}" y="128.5">{t["trend"][0]} <tspan font-style="italic" font-size="3.6">{t["trend"][1].format(r=r)}</tspan></text>
  </g>''')

    return '\n\n'.join(out)


def main():
    rate, trend = fit()
    for lang in ('es', 'en'):
        t = TXT[lang]
        logo_src = (DESIGN / f'{lang}.orange.front.svg').read_text()
        a = logo_src.index('  <svg x=')
        logo = logo_src[a:logo_src.index('</svg>', a) + 6]
        svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!--
  Design: crecimiento-exponencial (chest, {'Spanish' if lang == 'es' else 'English'})
  Voice lane: A (data, no adjectives)
  GENERATED by scripts/draw-crecimiento.py — edit the data there, not here.

  Layout (200 × 200 mm canvas):
    y=15..63    logo
    y=68..100   headline "×5 {t['h']}" (Epoch AI, verbatim figure) + scope
    y=104..176  LINEAR-scale chart: notable models (Epoch AI; filled =
                reported, hollow = Epoch estimate) + exponential trend
                (×{rate:.2f}/yr fitted to them). Time axis broken 2013.6–2018.
    y=191       source line

  Body = ink, accent = white on the orange tee: "×5" and the trend curve.
-->
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 200 200"
     width="200mm" height="200mm"
     role="img"
     aria-label="{t['title']}">
  <title>{t['title']}</title>

{logo}

  <g id="headline" {F}>
    <text x="16" y="99" font-size="46"><tspan class="accent" fill="{WHITE}">×5</tspan></text>
    <text x="64" y="84" font-size="19" fill="{INK}">{t['h']}</text>
    <text x="64.5" y="91.5" font-size="5.6" font-style="italic" fill="{INK}">{t['sub'][0]}</text>
    <text x="64.5" y="97.8" font-size="5.6" font-style="italic" fill="{INK}">{t['sub'][1]}</text>
  </g>

{build(lang, rate, trend)}

  <text id="source" x="100" y="192" {F} font-style="italic" font-size="3.4" fill="{INK}" text-anchor="middle">{t['src']}</text>
</svg>
'''
        (DESIGN / f'{lang}.orange.front.svg').write_text(svg)
        print(f'  wrote {lang}.orange.front.svg  (trend ×{rate:.2f}/yr)')


if __name__ == '__main__':
    main()
