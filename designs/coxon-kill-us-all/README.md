# coxon-kill-us-all

**ES:** Coxon: matarnos a todos

> LOB LAN's hand-drawn portrait of Jacob Coxon, who quit Anthropic in
> September 2026 after three years of pretraining research at OpenAI and
> Anthropic. Beside it is the line from his resignation thread that
> reports what the insiders believe: **"The people building AI earnestly
> believe that it could `kill us all` by the end of the decade."** It isn't
> an outsider's prediction. It's a researcher telling us what he heard
> inside two frontier labs. Part of the portrait-quote series (Hawking,
> Hinton, Bengio, Russell, Coxon), which shares one layout.

## Voice lane

**B — Accountability / protest.** An insider's public account of the
industry, quoted verbatim.

## Status

`draft`: ES + EN on orange, white and black tees. The fronts are generated
by `scripts/draw-portrait-quotes.py`; the white/black variants by
`scripts/build-coxon-kill-us-all.py` (standard rule,
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
| "Kill us all" (`class="accent"`) | WHITE | ORANGE | ORANGE |

- [x] Orange (canonical), white: the drawing prints as drawn.
- [x] Black: generated, but the portrait prints as a **negative**. The cap
      brim and glasses, solid ink in the drawing, turn white. It still
      reads; see `illustrations/portraits/README.md`.

## Portrait

Jacob Coxon by **LOB LAN** (2026-10), hand-drawn and commissioned by the
chapter, CC BY-SA 4.0. Credited in
[`illustrations/portraits/README.md`](../../illustrations/portraits/README.md).
The front inlines `illustrations/portraits/coxon/lines.svg` unmodified,
with the illustrator's signature, about 108 mm wide at print size.

**Styles:** the repo's prints and mockups use the line version. On the web
generator the card offers all three finishes of the same drawing: **lines**
(1 ink), **halftone** (shading as dots, 1 ink) and **tone** (shading as a
flat second ink, the body colour faded toward the tee). The halftone screen
isn't yet resized for this print size; see
[`illustrations/portraits/README.md`](../../illustrations/portraits/README.md).

## Source (verified 2026-10-24)

- **Quote (verbatim, the full sentence):** *"The people building AI
  earnestly believe that it could kill us all by the end of the decade."*
  Post 3 of a 7-post thread.
- **Why the full sentence:** the short version that circulates ("It could
  kill us all by the end of the decade") turns his report of what insiders
  believe into his own prediction. Print the whole sentence.
- **Who:** Jacob Coxon, X handle @hilbertspaess. In his own words: "I
  spent the last three years doing pretraining research at both OpenAI and
  Anthropic." The print says "Former OpenAI and Anthropic researcher". How
  long he spent at Anthropic varies between outlets (about four months,
  per Axios; joined July 2026, per IBTimes UK), so the print doesn't
  say.
- **Where / when:** thread on X, **8 September 2026, 17:04 San Francisco
  time** (9 Sep 00:04 UTC, so European outlets date it the 9th):
  - The quoted post: https://x.com/hilbertspaess/status/2097476203863224394
  - Opening post ("I resigned from Anthropic today…"):
    https://x.com/hilbertspaess/status/2097476196791709843. The
    150M+ views figure that circulates is this post's, not the quoted one's.
- **The rest of post 3:** "This is not a marketing stunt. If anything, many
  executives and senior researchers will couch their phrasing in the press
  to sound sensible - but I hear the same people express fear privately.
  No other human activity poses this level of danger."
- **Coverage:** Fortune (Emily Forlini, 10 Sep 2026, critical of him),
  https://fortune.com/2026/09/10/ex-anthropic-researcher-jacob-coxon-ai-could-end-humanity-fails-to-answer-most-essential-question/
  · AP via NBC New York (9 Sep 2026),
  https://www.nbcnewyork.com/news/national-international/anthropic-researcher-resigns-warning-ai
  · IBTimes UK (9 Sep 2026),
  https://www.ibtimes.co.uk/ai-researcher-resigns-warns-superintelligence-threat-2030-1818808
- **Know before wearing:** IBTimes UK reports he told Anderson Cooper
  "Right now, there's no risk of extinction", meaning today's models.
  The quote is about where the labs believe this is heading by 2030, not
  about current systems.
- **Spanish rendering:** «Quienes construyen la IA creen sinceramente que
  podría matarnos a todos antes de que acabe la década.» is our
  translation. EFE (9 Sep 2026) paraphrased it as las personas detrás de
  la IA "creen que podrá matarnos a todos al final de esta década":
  https://www.diariodeleon.es/sociedad/260909/2096888/dimite-ingeniero-anthropic-compania-openai-juegan-vidas.html

## Other quotes on the card

The opening post ("…They are racing straight to self-improving
superintelligence and gambling with our lives.") is
[`coxon-gambling-with-our-lives`](../coxon-gambling-with-our-lives/). On the
web generator both share Coxon's card.

## Constraints honored

- [x] Brand tokens only (ink, white, orange)
- [x] Logo inlined unmodified (on-orange ES / global EN)
- [x] ≥ 5 mm safe area (portrait x 6–96, text x 101–194)
- [x] Portrait: human-drawn, credited, unmodified; no caricature
- [x] Quote verbatim, full sentence (EN) / labelled translation (ES)
- [x] Text outlined by `scripts/print-export.py`
- [ ] Hairlines: the drawing's brush strokes taper. About 5 % of the inked
      area is under 0.4 mm at print size (the median stroke is 2.4 mm).
      Check a test print.
