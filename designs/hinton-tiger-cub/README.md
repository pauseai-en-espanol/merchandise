# hinton-tiger-cub

**ES:** Hinton: cachorro de tigre

> LOB LAN's hand-drawn portrait of Geoffrey Hinton beside his metaphor
> for where we stand with AI: **"We're like somebody who has this `really
> cute tiger cub.` … Unless you can be very sure that it's not going to want
> to kill you when it's grown up, `you should worry.`"** The two accent
> lines carry it on their own, from cute to worrying. It's the warning in
> its gentlest, most memorable form, from the Nobel laureate who helped
> build the field. A companion to `ask-a-chicken`, this time with his face.
> Part of the portrait-quote series (Hawking, Hinton, Bengio, Russell,
> Coxon), which shares one layout.

## Voice lane

**A — Thoughtful policy conversation.** A metaphor that invites
reflection. It doesn't accuse anyone.

## Status

`draft`: ES + EN on orange, white and black tees. The fronts are generated
by `scripts/draw-portrait-quotes.py`; the white/black variants by
`scripts/build-hinton-tiger-cub.py` (standard rule, `scripts/tee_variants.py`).

The quote is long for the column, so the middle lines are small (about
5–6 mm cap height at print size). Fine for someone reading it up close;
from across a room you get "tiger cub" and "you should worry".

## Languages

- [x] Spanish (`es.orange.front.svg`): our translation, labelled
      "Traducción PauseAI en Español" on the print
- [x] English (`en.orange.front.svg`): verbatim, cut marked with "…"

## Target products

- [x] T-shirt, front print (200 × 200 mm)
- [x] Back: QR + URL via `scripts/build-qr.py`

## Colors supported

| Element | Orange | White | Black |
|---|---|---|---|
| Portrait, setup lines, attribution (**body**) | INK | INK | WHITE |
| "Really cute tiger cub", "you should worry" (`class="accent"`) | WHITE | ORANGE | ORANGE |

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
generator the card offers all three finishes of the same drawing: **lines**
(1 ink), **halftone** (shading as dots, 1 ink) and **tone** (shading as a
flat second ink, the body colour faded toward the tee). The halftone screen
isn't yet resized for this print size; see
[`illustrations/portraits/README.md`](../../illustrations/portraits/README.md).

## Source (verified 2026-10-24)

- **Full passage:** "I think the situation we're in right now, the best
  way to understand it emotionally is we're like somebody who has this
  really cute tiger cub. It's just such a cute tiger cub. [Now,] unless
  you can be very sure that it's not going to want to kill you when it's
  grown up, you should worry."
- **Printed:** from "we're like somebody" to "you should worry", with the
  cut marked "…" (ES «[…]»). We cut "It's just such a cute tiger cub."
  (it repeats the image) and the faint "Now," that may follow it, so
  nothing uncertain is printed.
- **Who:** Geoffrey Hinton, 2024 Nobel Prize in Physics (shared with John
  Hopfield) and 2018 Turing Award.
- **Where / when:** CBS News interview by Brook Silva-Braga, recorded in
  Toronto. Aired on *CBS Saturday Morning*, **26 April 2025**.
  - Full interview (CBS Mornings on YouTube), **34:59–35:23**:
    https://www.youtube.com/watch?v=qyH3NxFz3Aw&t=2099
  - CBS article: https://www.cbsnews.com/news/godfather-of-ai-geoffrey-hinton-ai-warning/
    (its text leaves the tiger-cub lines out; cite the video)
  - Business Insider (28 Apr 2025):
    https://www.businessinsider.com/ai-godfather-geoffrey-hinton-superintelligence-risk-takeover-2025-4
- **Checked against:** YouTube's captions plus an independent
  transcription of the clip.
- **Don't print the short version alone:** "It's just such a cute tiger
  cub" sounds affectionate on its own. The warning is in the sentence
  that follows.
- **Spanish rendering:** «Somos como alguien que tiene un cachorro de tigre
  muy mono. […] A menos que puedas estar muy seguro de que no va a querer
  matarte cuando crezca, deberías preocuparte.» is our translation; we
  found no published Spanish version.

## Other quotes on the card

His question from the same interview (34:35), "…how many examples do you
know of less intelligent things controlling much more intelligent things?",
is [`hinton-less-intelligent-things`](../hinton-less-intelligent-things/).
On the web generator both share Hinton's card. (`ask-a-chicken` quotes him
too, but with a hen instead of his face, so it keeps its own card.)

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
