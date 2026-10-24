# hawking-superseded

**ES:** Hawking: serían reemplazados

> LOB LAN's hand-drawn portrait of Stephen Hawking beside the reasoning
> behind his 2014 warning to the BBC: **"Humans, who are limited by slow
> biological evolution, couldn't compete, and would be `superseded.`"** Where
> `hawking-end-of-the-human-race` states the conclusion, this gives the
> mechanism. It's the second quote on Hawking's card in the web generator.

## Voice lane

**A — Thoughtful policy conversation.** A calm, explanatory warning from
one of the best-known scientists of our time.

## Status

`ready`: ES + EN on orange, white and black tees. The fronts are generated
by `scripts/draw-portrait-quotes.py`; the white/black variants by
`scripts/build-hawking-superseded.py` (standard rule, `scripts/tee_variants.py`).

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
| "Superseded" (`class="accent"`) | WHITE | ORANGE | ORANGE |

- [x] Orange (canonical), white: the drawing prints as drawn.
- [x] Black: generated, but the portrait prints as a **negative** (white
      lines). It still reads; see `illustrations/portraits/README.md`.

## Portrait

Stephen Hawking by **LOB LAN** (2026-10), hand-drawn and commissioned by the
chapter, CC BY-SA 4.0. Credited in
[`illustrations/portraits/README.md`](../../illustrations/portraits/README.md).
The front inlines `illustrations/portraits/hawking/lines.svg` unmodified,
with the illustrator's signature, about 108 mm wide at print size.

**Styles:** the repo's prints and mockups use the line version. On the web
generator the card offers all three finishes of the same drawing:
**lines**, **halftone** and **tone** (see the portraits README).

## Source (verified 2026-10-24)

- **Quote (verbatim):** *"Humans, who are limited by slow biological
  evolution, couldn't compete, and would be superseded."*
- **Who:** Stephen Hawking (1942–2018), theoretical physicist, University
  of Cambridge.
- **Where / when:** BBC News, Rory Cellan-Jones, "Stephen Hawking warns
  artificial intelligence could end mankind", **2 December 2014**. The
  same interview as `hawking-end-of-the-human-race`:
  https://www.bbc.co.uk/news/technology-30290540
- **Context:** just before, he says full AI "would take off on its own,
  and re-design itself at an ever increasing rate".
- **Spanish rendering:** «Los humanos, limitados por la lenta evolución
  biológica, no podrían competir y serían reemplazados.» is our
  translation. "Superseded" → "reemplazados" (replaced), the literal
  sense, rather than "superados" (outdone).

## Constraints honored

- [x] Brand tokens only (ink, white, orange)
- [x] Logo inlined unmodified (on-orange ES / global EN)
- [x] ≥ 5 mm safe area (portrait x 6–96, text x 101–194)
- [x] Portrait: human-drawn, credited, unmodified; no caricature
- [x] Quote verbatim (EN) / labelled translation (ES)
- [x] Text outlined by `scripts/print-export.py`
- [ ] Hairlines: the drawing's brush strokes taper. About 10 % of the inked
      area is under 0.4 mm at print size (the median stroke is 0.9 mm).
      Check a test print.
