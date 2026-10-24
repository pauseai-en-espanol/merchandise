# russell-russian-roulette

**ES:** Russell: ruleta rusa

> LOB LAN's hand-drawn portrait of Stuart Russell beside what he said about
> the heads of the leading AI companies: **"They are playing `Russian
> roulette` with every human being on Earth, `without our permission.`"**
> Russell co-wrote the standard AI textbook, so this isn't an outsider's
> fear. It's the field's own teacher saying no one asked us. The consent
> argument is the core of the pause. Part of the portrait-quote series
> (Hawking, Hinton, Bengio, Russell, Coxon), which shares one layout.

## Voice lane

**B — Accountability / protest.** It's aimed at named industry leaders,
in a leading scientist's verbatim words. The portrait is of the speaker,
not of the people he's criticising.

## Status

`ready`: ES + EN on orange, white and black tees. The fronts are generated
by `scripts/draw-portrait-quotes.py`; the white/black variants by
`scripts/build-russell-russian-roulette.py` (standard rule,
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
| "Russian roulette", "without our permission" (`class="accent"`) | WHITE | ORANGE | ORANGE |

- [x] Orange (canonical), white: the drawing prints as drawn.
- [x] Black: generated, but the portrait prints as a **negative** (white
      lines). It still reads; see `illustrations/portraits/README.md`.

## Portrait

Stuart Russell by **LOB LAN** (2026-10), hand-drawn and commissioned by the
chapter, CC BY-SA 4.0. Credited in
[`illustrations/portraits/README.md`](../../illustrations/portraits/README.md).
The front inlines `illustrations/portraits/russell/lines.svg` unmodified,
with the illustrator's signature, about 108 mm wide at print size.

**Styles:** the repo's prints and mockups use the line version. On the web
generator the card offers all three finishes of the same drawing: **lines**
(1 ink), **halftone** (shading as dots, 1 ink) and **tone** (shading as a
flat second ink, the body colour faded toward the tee).

## Source (verified 2026-10-24)

- **Quote (verbatim):** *"They are playing Russian roulette with every
  human being on Earth, without our permission."* He pauses where we put
  the comma.
- **Who:** Stuart Russell, Professor of Computer Science, UC Berkeley;
  co-author of *Artificial Intelligence: A Modern Approach*.
- **Where / when:** *The Diary of a CEO* with Steven Bartlett, released
  **4 December 2025**. YouTube title: "An AI Expert Warning: 6 People Are
  (Quietly) Deciding Humanity's Future!" (the podcast feed title differs).
  At **25:40**: https://www.youtube.com/watch?v=P7Y-fynYsgE&t=1540
- **Full passage:** "So what are they doing? They are playing Russian
  roulette with every human being on Earth without our permission. They're
  coming into our houses, putting a gun to the head of our children,
  pulling the trigger, and saying, 'Well, you know, possibly everyone will
  die. Oops. But possibly we'll get incredibly rich.'"
- **Who "they" are:** just before this, he names Dario Amodei, Elon Musk and
  Sam Altman and their stated odds of catastrophe. The lead-in line
  ("On the heads of the AI companies:" / «Sobre los líderes de las empresas
  de IA:») is ours. It sits outside the quote marks so the quote itself
  stays untouched.
- **Checked against:** YouTube's automatic captions (there's no official
  transcript) plus an independent transcription of the clip.
- **Don't mix up** with Russell's remark to AFP in New Delhi, February
  2026, which is aimed at governments ("For governments to allow private
  entities to essentially play Russian roulette with every human being on
  earth … is, in my view, a total dereliction of duty"):
  https://fortune.com/2026/02/18/big-tech-russian-roulette-ai-race-humanity-extinction
- **Spanish rendering:** «Están jugando a la ruleta rusa con cada ser
  humano de la Tierra, sin nuestro permiso.» is our translation; we found
  no published Spanish version.

## Other quotes on the card

His account of the AI CEO who sees a Chernobyl-scale disaster as "the best
case scenario" (same episode, 4:14) is
[`russell-best-case-scenario`](../russell-best-case-scenario/). On the web
generator both share Russell's card.

## Constraints honored

- [x] Brand tokens only (ink, white, orange)
- [x] Logo inlined unmodified (on-orange ES / global EN)
- [x] ≥ 5 mm safe area (portrait x 6–96, text x 101–194)
- [x] Portrait: human-drawn, credited, unmodified; no caricature
- [x] Quote verbatim (EN) / labelled translation (ES); our context line is
      outside the quote marks
- [x] Text outlined by `scripts/print-export.py`
- [ ] Hairlines: the drawing's brush strokes taper. About 8 % of the inked
      area is under 0.4 mm at print size (the median stroke is 0.9 mm).
      Check a test print.
