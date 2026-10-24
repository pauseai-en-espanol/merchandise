# hawking-end-of-the-human-race

**ES:** Hawking: el fin de la raza humana

> LOB LAN's hand-drawn portrait of Stephen Hawking beside his warning to the
> BBC in 2014: **"The development of full artificial intelligence could
> spell `the end of the human race.`"** Most people know who said it, and
> the name carries authority. Twelve years later, the labs say openly that
> "full" AI is what they're building. Part of the portrait-quote series
> (Hawking, Hinton, Bengio, Russell, Coxon), which shares one layout.

## Voice lane

**A — Thoughtful policy conversation.** A calm, historic warning from one
of the best-known scientists of our time, like `turing-1951`. It doesn't
accuse anyone; it invites the question "was he right?"

## Status

`ready`: ES + EN on orange, white and black tees. The fronts are generated
by `scripts/draw-portrait-quotes.py`; the white/black variants by
`scripts/build-hawking-end-of-the-human-race.py` (standard rule,
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
| Payoff lines (`class="accent"`) | WHITE | ORANGE | ORANGE |

- [x] Orange (canonical), white: the drawing prints as drawn.
- [x] Black: generated, but the portrait prints as a **negative** (white
      lines, so the shadows read as highlights). It still reads; see
      `illustrations/portraits/README.md`.

## Portrait

Stephen Hawking by **LOB LAN** (2026-10), hand-drawn and commissioned by the
chapter, CC BY-SA 4.0. Credited in
[`illustrations/portraits/README.md`](../../illustrations/portraits/README.md).
The front inlines `illustrations/portraits/hawking/lines.svg` unmodified,
with the illustrator's signature, about 108 mm wide at print size.

**Styles:** the repo's prints and mockups use the line version. On the web
generator the card offers all three finishes of the same drawing: **lines**
(1 ink), **halftone** (shading as dots, 1 ink) and **tone** (shading as a
flat second ink, the body colour faded toward the tee).

## Source (verified 2026-10-24)

- **Quote (verbatim):** *"The development of full artificial intelligence
  could spell the end of the human race."*
- **Who:** Stephen Hawking (1942–2018), theoretical physicist, University
  of Cambridge. The BBC calls him "one of Britain's pre-eminent scientists".
- **Where / when:** BBC News, Rory Cellan-Jones, "Stephen Hawking warns
  artificial intelligence could end mankind", **2 December 2014**:
  https://www.bbc.co.uk/news/technology-30290540
- **Context:** asked about the upgrade to his Intel/SwiftKey communication
  system. The same article goes on: "It would take off on its own, and
  re-design itself at an ever increasing rate," and "Humans, who are
  limited by slow biological evolution, couldn't compete, and would be
  superseded." He said *full* AI, not today's systems; the print keeps
  the word.
- **Spanish rendering:** «El desarrollo de una inteligencia artificial
  completa podría significar el fin de la raza humana.» is our
  translation. BBC Mundo published its own the same day ("el desarrollo
  de una completa inteligencia artificial (IA) podría traducirse en el fin
  de la raza humana"):
  https://www.bbc.com/mundo/ultimas_noticias/2014/12/141202_ultnot_hawking_inteligencia_artificial_riesgo_humanidad_egn

## Other quotes on the card

The reasoning that follows in the same interview ("Humans, who are limited
by slow biological evolution, couldn't compete, and would be superseded.")
is [`hawking-superseded`](../hawking-superseded/). On the web generator both
share Hawking's card.

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
