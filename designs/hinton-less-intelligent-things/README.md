# hinton-less-intelligent-things

**ES:** Hinton: cosas menos inteligentes

> LOB LAN's hand-drawn portrait of Geoffrey Hinton beside his question:
> **"…How many examples do you know of less intelligent things controlling
> `much more intelligent things?`"** The wearer doesn't have to argue
> anything. The question does it, and most people can't name an example.
> It's the second quote on Hinton's card in the web generator.

## Voice lane

**A — Thoughtful policy conversation.** A question that invites
reflection, from a Nobel laureate.

## Status

`ready`: ES + EN on orange, white and black tees. The fronts are generated
by `scripts/draw-portrait-quotes.py`; the white/black variants by
`scripts/build-hinton-less-intelligent-things.py` (standard rule,
`scripts/tee_variants.py`).

## Languages

- [x] Spanish (`es.orange.front.svg`): our translation, labelled
      "Traducción PauseAI en Español" on the print
- [x] English (`en.orange.front.svg`): verbatim, the cut at the start
      marked with "…"

## Target products

- [x] T-shirt, front print (200 × 200 mm)
- [x] Back: QR + URL via `scripts/build-qr.py`

## Colors supported

| Element | Orange | White | Black |
|---|---|---|---|
| Portrait, setup lines, attribution (**body**) | INK | INK | WHITE |
| "Much more intelligent things?" (`class="accent"`) | WHITE | ORANGE | ORANGE |

- [x] Orange (canonical), white: the drawing prints as drawn.
- [x] Black: generated, but the portrait prints as a **negative** (white
      lines). It still reads; see `illustrations/portraits/README.md`.

## Portrait

Geoffrey Hinton by **LOB LAN** (2026-10), hand-drawn and commissioned by the
chapter, CC BY-SA 4.0. Credited in
[`illustrations/portraits/README.md`](../../illustrations/portraits/README.md).
The front inlines `illustrations/portraits/hinton/lines.svg` unmodified,
with the illustrator's signature, about 103 mm wide at print size.

**Styles:** the repo's prints and mockups use the line version. On the web
generator the card offers all three finishes of the same drawing:
**lines**, **halftone** and **tone** (see the portraits README).

## Source (verified 2026-10-24)

- **Passage (34:35):** "One thing to bear in mind is **how many examples do
  you know of less intelligent things controlling much more intelligent
  things?** So we know that [if] things are more or less equal
  intelligence, the less intelligent one can control the more intelligent
  one. But with a big gap in intelligence, there's very, very few examples
  where the more intelligent one isn't in control."
- **Printed:** the bold question. The cut before it ("One thing to bear in
  mind is") is marked "…".
- **Who:** Geoffrey Hinton, 2024 Nobel Prize in Physics (shared with John
  Hopfield) and 2018 Turing Award.
- **Where / when:** CBS News interview by Brook Silva-Braga, aired on *CBS
  Saturday Morning*, **26 April 2025** (the same interview as
  `hinton-tiger-cub`): https://www.youtube.com/watch?v=qyH3NxFz3Aw&t=2075
- **Checked against:** YouTube's captions plus an independent
  transcription of the clip; they agree on the printed words.
- **Related, print-only:** "There is not a good track record of less
  intelligent things controlling things of greater intelligence", as
  reported by Raffi Khatchadourian in *The New Yorker* ("The Doomsday
  Invention", 23 Nov 2015). That's the reporter's account, with no
  recording, so we print the line from the video instead.
- **Spanish rendering:** «…¿Cuántos ejemplos conoces de cosas menos
  inteligentes que controlen a cosas mucho más inteligentes?» is our
  translation.

## Constraints honored

- [x] Brand tokens only (ink, white, orange)
- [x] Logo inlined unmodified (on-orange ES / global EN)
- [x] ≥ 5 mm safe area (portrait x 10–96, text x 101–194)
- [x] Portrait: human-drawn, credited, unmodified; no caricature
- [x] Quote verbatim with the cut marked (EN) / labelled translation (ES)
- [x] Text outlined by `scripts/print-export.py`
- [ ] Hairlines: the drawing's brush strokes taper. About 11 % of the inked
      area is under 0.4 mm at print size (the median stroke is 1.2 mm).
      Check a test print.
