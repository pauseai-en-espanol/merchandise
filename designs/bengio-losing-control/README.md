# bengio-losing-control

**ES:** Bengio: perdiendo el control

> LOB LAN's hand-drawn portrait of Yoshua Bengio beside what he told AFP in
> September 2026: **"There's a reason that companies are saying this is
> going too fast, `that we're losing control.`"** One of the founders of
> deep learning says the warning signs come from the companies
> themselves. Part of the portrait-quote series (Hawking, Hinton, Bengio,
> Russell, Coxon), which shares one layout.

## Voice lane

**B — Accountability / protest.** It surfaces what the industry itself
admits, through a verbatim quote from one of its founders.

## Status

`ready`: ES + EN on orange, white and black tees. The fronts are generated
by `scripts/draw-portrait-quotes.py`; the white/black variants by
`scripts/build-bengio-losing-control.py` (standard rule,
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
| Portrait, setup lines, attribution (**body**) | INK | INK | WHITE |
| "That we're losing control" (`class="accent"`) | WHITE | ORANGE | ORANGE |

- [x] Orange (canonical), white: the drawing prints as drawn.
- [x] Black: generated, but the portrait prints as a **negative** (white
      lines). It still reads; see `illustrations/portraits/README.md`.

## Portrait

Yoshua Bengio by **LOB LAN** (2026-10), hand-drawn and commissioned by the
chapter, CC BY-SA 4.0. Credited in
[`illustrations/portraits/README.md`](../../illustrations/portraits/README.md).
The front inlines `illustrations/portraits/bengio/lines.svg` unmodified,
with the illustrator's signature, about 104 mm wide at print size.

**Styles:** the repo's prints and mockups use the line version. On the web
generator the card offers all three finishes of the same drawing: **lines**
(1 ink), **halftone** (shading as dots, 1 ink) and **tone** (shading as a
flat second ink, the body colour faded toward the tee).

## Source (verified 2026-10-24)

- **Quote (verbatim):** *"There's a reason that companies are saying this
  is going too fast, that we're losing control."*
- **Not the headline:** AFP's headline, "'We're losing control'", isn't a
  sentence he said on its own. It's the end of the sentence above, so we
  print the whole sentence. The article also reports that he told AFP
  humanity is "losing control" of the technology, and that AI is "an
  international challenge, a bit like nuclear weapons are an
  international challenge."
- **Who:** Yoshua Bengio, 2018 Turing Award, professor at the Université
  de Montréal, founder of Mila.
- **Where / when:** AFP interview by Fanny Alarcon in Montreal, **Tuesday
  15 September 2026**, published 16 September. The print says "September
  2026".
  - CTV News: https://www.ctvnews.ca/sci-tech/article/were-losing-control-canadian-ai-pioneer-yoshua-bengio-warns/
  - CP24: https://www.cp24.com/news/canada/2026/09/16/were-losing-control-canadian-ai-pioneer-yoshua-bengio-warns/
  - eNCA (with byline): https://www.enca.com/business/were-losing-control-ai-pioneer-yoshua-bengio-tells-afp
- **Reading:** "that we're losing control" can be read as part of what the
  companies are saying, and AFP's Spanish service read it that way. Our
  translation keeps the same structure, so it doesn't settle the
  ambiguity either way.
- **Spanish rendering:** «Hay una razón por la que las empresas dicen que
  esto va demasiado rápido, que estamos perdiendo el control.» is our
  translation from the English. AFP's Spanish service (via NTN24, 16 Sep
  2026) has "Hay una razón por la que estas empresas dicen que esto va
  demasiado rápido, que estamos perdiendo el control":
  https://www.ntn24.com/noticias-ciencia-y-tecnologia/uno-de-los-fundadores-de-la-inteligencia-artificial-pide-control-a-la-tecnologia-similar-al-de-las-armas-nucleares-estamos-perdiendo-el-control-650791

## Constraints honored

- [x] Brand tokens only (ink, white, orange)
- [x] Logo inlined unmodified (on-orange ES / global EN)
- [x] ≥ 5 mm safe area (portrait x 9–96, text x 101–194)
- [x] Portrait: human-drawn, credited, unmodified; no caricature
- [x] Quote verbatim, full sentence (EN) / labelled translation (ES)
- [x] Text outlined by `scripts/print-export.py`
- [ ] Hairlines: the drawing's brush strokes taper. About 14 % of the inked
      area is under 0.4 mm at print size (the median stroke is 1.0 mm).
      Check a test print.
