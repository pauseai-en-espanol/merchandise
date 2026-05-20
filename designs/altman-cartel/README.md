# altman-cartel

> A "wanted poster"–style chest design: halftone portrait of Sam Altman
> with his 2014 quote as the caption. The portrait is the punch; the
> quote explains why. Highest-impact and highest-legal-exposure of the
> four chapter activist tees.

## Voice lane

**B — Accountability / protest.** Most direct register: real public
figure + their own quoted words.

## Status

`draft` — layout, typography, and a halftone portrait built from a
**Creative Commons** licensed source are in place. The design is
ready for design review; legal exposure is much lower than the
earlier draft because the source photo is properly licensed (with
required attribution baked into the README, the SVG metadata, and
the print artwork).

## Languages

- [x] Spanish (`design.es.svg`)
- [ ] English

## Target products

- [x] T-shirt on orange background

## Colors supported

- [x] Orange (`design.es.svg` / `back.svg` — canonical)
- [x] White (`design.es.white.svg` / `back.white.svg` — generated)
- [x] Black (`design.es.black.svg` / `back.black.svg` — generated)

Variants are produced by `scripts/build-color-variants.py` from the
canonical orange-tee SVG; do not edit the `.white.` / `.black.`
files directly. See `CLAUDE.md` for the swap rules.


## Sources

- **Quote:** identical to `designs/altman-fin-del-mundo/` — see that
  README for full source notes. Same Sam Altman blog post, c. 2014.

- **Portrait — Creative Commons, properly licensed.**
  - Source file in repo: `assets/altman-source.jpg`
  - Provenance: cropped and edited by *James Tamim* from a photograph
    by *Steve Jennings* taken at TechCrunch Disrupt SF 2019.
  - Hosted on Wikimedia Commons:
    https://commons.wikimedia.org/wiki/File:Sam_Altman_CropEdit_James_Tamim.jpg
  - License: **Creative Commons Attribution 2.0 Generic (CC BY 2.0)**
    — https://creativecommons.org/licenses/by/2.0/
  - **Required attribution wording** (per the Commons file page):
    *"Photo by Steve Jennings / Getty Images for TechCrunch"*
  - The visible attribution line on the front of the shirt was
    intentionally removed — it crowded the design. Per Creative
    Commons guidance, the required credit may appear in a
    context-appropriate location instead. For this design that
    means:
      - the SVG's `<desc>` metadata (already present), and
      - **the listing page / hangtag wherever the shirt is sold**
        (must include "Photo by Steve Jennings / Getty Images for
        TechCrunch · CC BY 2.0" + link to the license).
    Treat the listing-page credit as a hard requirement before any
    print run goes on sale.
  - Never use AI-generated portraits (see `CLAUDE.md`).
- **Halftone processing.** `assets/altman-halftone.png` is a 1-bit
  dot-halftone version of `altman-source.jpg`, produced with Pillow:
  resize to 720 × 720 grayscale → contrast × 1.25 → 8-px-cell dot
  halftone (dot radius scaled to cell darkness) → save as 1-bit PNG
  (≈ 5.7 KB). To re-process: replace `assets/altman-source.jpg` with
  a new licensed photo and re-run the same script (it should be
  factored into `scripts/halftone.py` once we add the build dir).

## Legal note (important)

Using a public figure's *likeness* on commercial merchandise can trigger
"derecho a la propia imagen" claims in Spain (LO 1/1982), even for
public figures, even when the underlying message is commentary. Quoting
them in text — as in `designs/altman-fin-del-mundo/` — is much safer
than depicting them.

This design is documented and drafted, but **before producing in
quantity, consult legal review.** `altman-fin-del-mundo` carries the
same rhetorical punch with much lower exposure.

## Constraints honored

- [x] Brand tokens only
- [x] No logo modifications
- [x] Fits print area (200 × 200 mm)
- [ ] Portrait sourced + licensed
- [ ] Halftone-processed image inlined
- [ ] Text outlined for production
- [ ] Logo inlined for production

## Notes

- The chapter mark (`pauseai-es-mark.svg`) is used in a small "stamp"
  size at the top — gives brand recognition without competing with the
  portrait.
- Portrait placeholder is a dark rect with instructions inside; replace
  before printing.
- Consider this design optional / experimental for now. Ship
  `altman-fin-del-mundo` first; revisit this one if you want a more
  poster-aggressive variant later.
