# russell-best-case-scenario

**ES:** Russell: el mejor escenario posible

> LOB LAN's hand-drawn portrait of Stuart Russell beside his account of a
> conversation with the head of a leading AI company, who sees a
> Chernobyl-scale AI disaster as the best outcome left: **"…He looked at this
> Chernobyl-scale disaster as `the best case scenario,` because then the
> governments would regulate…"** It tells strangers that people inside the
> industry are already hoping for a warning shot. It's the second quote on
> Russell's card in the web generator.

## Voice lane

**B — Accountability / protest.** It reports what an industry leader
privately believes, in a leading scientist's verbatim words. The CEO isn't
named, here or in the source.

## Status

`draft`: ES + EN on orange, white and black tees. The fronts are generated
by `scripts/draw-portrait-quotes.py`; the white/black variants by
`scripts/build-russell-best-case-scenario.py` (standard rule,
`scripts/tee_variants.py`).

## Languages

- [x] Spanish (`es.orange.front.svg`): our translation, labelled
      "Traducción PauseAI en Español" on the print
- [x] English (`en.orange.front.svg`): verbatim, cuts marked with "…"

## Target products

- [x] T-shirt, front print (200 × 200 mm)
- [x] Back: QR + URL via `scripts/build-qr.py`

## Colors supported

| Element | Orange | White | Black |
|---|---|---|---|
| Portrait, lead-in, setup lines, attribution (**body**) | INK | INK | WHITE |
| "The best case scenario" (`class="accent"`) | WHITE | ORANGE | ORANGE |

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
generator the card offers all three finishes of the same drawing:
**lines**, **halftone** and **tone** (see the portraits README).

## Source (verified 2026-10-24)

- **Passage (4:14–5:22):** "Uh, so it was with one of the CEOs of uh a
  leading AI company. He sees two possibilities as do I, which is um either
  we have a small or let's say small scale disaster of the same scale as
  Chernobyl … So that would wake people up. That would get the governments
  to regulate. He's talked to the governments and they won't do it. **So he
  looked at this Chernobyl scale disaster as the best case scenario because
  then the governments would regulate** and require AI systems to be built."
  Then: "He runs one of the leading AI companies."
- **Printed:** the bold words, from "he looked" to "would regulate". The
  cuts at both ends are marked "…". The commas and the hyphen in
  "Chernobyl-scale" are our punctuation of speech.
- **Attribution:** "best case scenario" is Russell describing the CEO's
  view, not a quote of the CEO, so the print attributes it to Russell. The
  lead-in ("On the head of a leading AI company:" / «Sobre el director de
  una gran empresa de IA:») is ours, outside the quote marks.
- **Who:** Stuart Russell, Professor of Computer Science, UC Berkeley;
  co-author of *Artificial Intelligence: A Modern Approach*.
- **Where / when:** *The Diary of a CEO* with Steven Bartlett, released
  **4 December 2025** (the same episode as `russell-russian-roulette`):
  https://www.youtube.com/watch?v=P7Y-fynYsgE&t=254
- **Checked against:** YouTube's automatic captions plus an independent
  transcription. They differ slightly elsewhere in the passage ("of the same
  scale" / "at the same scale"; "He's talked" / "Talk"), not in the
  printed words. Listen again before printing a run.
- **Spanish rendering:** «…veía este desastre a escala de Chernóbil como el
  mejor escenario posible, porque entonces los gobiernos regularían…» is
  our translation.

## Constraints honored

- [x] Brand tokens only (ink, white, orange)
- [x] Logo inlined unmodified (on-orange ES / global EN)
- [x] ≥ 5 mm safe area (portrait x 6–96, text x 101–194)
- [x] Portrait: human-drawn, credited, unmodified; no caricature
- [x] Quote verbatim with cuts marked (EN) / labelled translation (ES); no
      catastrophe imagery (the disaster is named, not shown)
- [x] Text outlined by `scripts/print-export.py`
- [ ] Hairlines: the drawing's brush strokes taper. About 8 % of the inked
      area is under 0.4 mm at print size (the median stroke is 0.9 mm).
      Check a test print.
