# coxon-gambling-with-our-lives

**ES:** Coxon: se juegan nuestras vidas

> LOB LAN's hand-drawn portrait of Jacob Coxon beside the opening of his
> resignation thread, the most-viewed post of it: **"They are racing straight
> to self-improving superintelligence and `gambling with our lives.`"**
> "They" are OpenAI and Anthropic, the two labs he worked at. It's the
> second quote on Coxon's card in the web generator.

## Voice lane

**B — Accountability / protest.** An insider names both labs, verbatim.

## Status

`ready`: ES + EN on orange, white and black tees. The fronts are generated
by `scripts/draw-portrait-quotes.py`; the white/black variants by
`scripts/build-coxon-gambling-with-our-lives.py` (standard rule,
`scripts/tee_variants.py`).

## Languages

- [x] Spanish (`es.orange.front.svg`): our translation, labelled
      "Traducción PauseAI en Español" on the print
- [x] English (`en.orange.front.svg`): verbatim

## Target products

- [x] T-shirt, front print (200 × 200 mm)
- [x] Back: QR + URL via `scripts/build-qr.py`

## Colors supported

| Element | Orange | White | Black |
|---|---|---|---|
| Portrait, lead-in, setup lines, attribution (**body**) | INK | INK | WHITE |
| "Gambling with our lives" (`class="accent"`) | WHITE | ORANGE | ORANGE |

- [x] Orange (canonical), white: the drawing prints as drawn.
- [x] Black: generated, but the portrait prints as a **negative**. The cap
      brim and glasses turn white. It still reads; see
      `illustrations/portraits/README.md`.

## Portrait

Jacob Coxon by **LOB LAN** (2026-10), hand-drawn and commissioned by the
chapter, CC BY-SA 4.0. Credited in
[`illustrations/portraits/README.md`](../../illustrations/portraits/README.md).
The front inlines `illustrations/portraits/coxon/lines.svg` unmodified,
with the illustrator's signature, about 108 mm wide at print size.

**Styles:** the repo's prints and mockups use the line version. On the web
generator the card offers all three finishes of the same drawing:
**lines**, **halftone** and **tone** (see the portraits README).

## Source (verified 2026-10-24)

- **Quote (verbatim):** *"They are racing straight to self-improving
  superintelligence and gambling with our lives."*
- **The opening post in full:** "I resigned from Anthropic today. I spent
  the last three years doing pretraining research at both OpenAI and
  Anthropic. Neither company is acting responsibly. They are racing
  straight to self-improving superintelligence and gambling with our lives.
  More thoughts below."
- **Who "they" are:** OpenAI and Anthropic ("Neither company…", the
  sentence before). The lead-in ("On OpenAI and Anthropic:" / «Sobre OpenAI
  y Anthropic:») is ours, outside the quote marks.
- **Who:** Jacob Coxon (@hilbertspaess), former pretraining researcher at
  OpenAI and Anthropic. See `coxon-kill-us-all` for the details and
  caveats about his background.
- **Where / when:** post on X, **8 September 2026, 17:04 San Francisco
  time** (9 Sep 00:04 UTC):
  https://x.com/hilbertspaess/status/2097476196791709843. Over 150 million
  views; this is the post that figure belongs to.
- **Coverage:** IBTimes UK (9 Sep 2026) quotes both sentences verbatim:
  https://www.ibtimes.co.uk/ai-researcher-resigns-warns-superintelligence-threat-2030-1818808
- **Spanish rendering:** «Corren directas hacia una superinteligencia que se
  mejora a sí misma y se están jugando nuestras vidas.» is our translation.
  "Gambling with" → "jugarse", the Spanish idiom for staking something you
  could lose. EFE (9 Sep 2026) wrote "jugando con nuestras vidas":
  https://www.diariodeleon.es/sociedad/260909/2096888/dimite-ingeniero-anthropic-compania-openai-juegan-vidas.html

## Constraints honored

- [x] Brand tokens only (ink, white, orange)
- [x] Logo inlined unmodified (on-orange ES / global EN)
- [x] ≥ 5 mm safe area (portrait x 6–96, text x 101–194)
- [x] Portrait: human-drawn, credited, unmodified; no caricature
- [x] Quote verbatim (EN) / labelled translation (ES); our context line is
      outside the quote marks
- [x] Text outlined by `scripts/print-export.py`
- [ ] Hairlines: the drawing's brush strokes taper. About 5 % of the inked
      area is under 0.4 mm at print size (the median stroke is 2.4 mm).
      Check a test print.
