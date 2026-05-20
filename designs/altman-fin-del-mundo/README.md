# altman-fin-del-mundo

> Sam Altman's own 2014 words laid out so the apocalyptic half dominates
> and the cynical "but great companies" continuation sits beneath it like
> a footnote. The contradiction *is* the design: the man who said this is
> now running OpenAI.

## Voice lane

**B — Accountability / protest.** Confrontational, evidence-based. Uses
the subject's verbatim words; no caricature, no paraphrase.

## Status

`draft`

## Languages

- [x] Spanish (`design.es.svg`)
- [ ] English (`design.en.svg`) — not produced yet
- [ ] Symbolic (not applicable — the quote is the point)

## Target products

- [x] T-shirt on orange background (`products/tshirt.yaml`)
- [ ] Sticker — the quote needs the full chest width to land
- [ ] Tote — possible variant later

## Colors supported

- [x] Orange (`design.es.svg` / `back.svg` — canonical)
- [x] White (`design.es.white.svg` / `back.white.svg` — generated)
- [x] Black (`design.es.black.svg` / `back.black.svg` — generated)

Variants are produced by `scripts/build-color-variants.py` from the
canonical orange-tee SVG; do not edit the `.white.` / `.black.`
files directly. See `CLAUDE.md` for the swap rules.


## Sources (verified)

- **Quote:** "AI will probably most likely lead to the end of the world,
  but in the meantime there will be great companies created with serious
  machine learning." — verified verbatim against the original.
- **Author:** Sam Altman, then president of Y Combinator; CEO of OpenAI
  from 2019.
- **Date / venue:** circa 2014–2015, Sam Altman's personal blog
  (`samaltman.com`). Wording and attribution confirmed by the chapter.
- **Spanish translation:** "La IA muy probablemente conducirá al fin del
  mundo, pero mientras tanto se crearán grandes empresas con machine
  learning serio." — chapter rendering; "machine learning" left in
  English matches Altman's own phrasing.

## Constraints honored

- [x] Uses only colors from `brand/tokens.json`
- [x] Does not modify files in `brand/logos/`
- [x] Fits inside the T-shirt print area with safe margin (200 × 200 mm
      canvas; logo + text within)
- [x] No hairlines below 0.4 mm
- [ ] Text converted to outlines for production — do before printing
- [ ] External `<image href="...">` to the logo is inlined for production —
      see Notes

## Notes

- Live `<text>` with brand fonts during iteration; convert to `<path>`
  outlines before production export.
- The chest SVG references the logo via `<image href="../../brand/logos/
  pauseai-es-on-orange.svg">`. Print vendors usually want a single
  self-contained file — replace this with the logo's path/rect elements
  inline before sending to print.
- The full Altman quote is on the chest (big half + smaller italic
  continuation) so we can't be accused of cherry-picking. Visual
  hierarchy carries the rhetorical weight.
- Back is `back.svg`: QR (currently a placeholder rect) + `pauseai.es`
  URL. Generate the real QR with:
  `qrencode -t SVG -m 1 'https://pauseai.es' > qr.svg` and inline.
