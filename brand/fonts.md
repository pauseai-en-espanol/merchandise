# Fonts

PauseAI's published brand spec
([pauseai.info](https://pauseai.info)) allows three libre fonts, all
available on Google Fonts under the SIL Open Font License 1.1:

| Family             | Allowed weights       | Use for                              |
|--------------------|-----------------------|--------------------------------------|
| **Saira Condensed**| 700 (Bold)            | Headlines, wordmarks, short slogans  |
| **Montserrat**     | 900 (Black)           | Extra-heavy headings / accent labels |
| **Roboto Slab**    | 300 (Light), 700 (Bold) | Body, taglines, attribution        |

Stick to those families and weights. Don't introduce other families
(no Arial / Helvetica / Times) and don't use intermediate Roboto Slab
weights (e.g. 400 Regular) — pick 300 for body, 700 for emphasis.

## Chapter preference

The current chapter activist tee set uses **Saira Condensed 700 for
every text element** — display, body, attribution, footers. Italic is
allowed for soft / secondary copy (e.g. an attribution or
continuation aside) at the same family and weight.

This is a chapter-level preference, not a restriction of the brand
spec. Montserrat 900 and Roboto Slab 300 / 700 remain allowed for
future designs that genuinely need them; if a new design uses
something other than Saira Condensed 700, flag the choice in the
design's README so the deviation is visible in review.

## Saira Condensed (Bold 700)

- **Family:** `Saira Condensed`
- **Weight:** `700`
- **Fallback stack:** `Impact, sans-serif`
- **Source:** https://fonts.google.com/specimen/Saira+Condensed
- **Use for:** main headings, big slogans, wordmark-style display text.

## Montserrat (Black 900)

- **Family:** `Montserrat`
- **Weight:** `900` (Black)
- **Fallback stack:** `Impact, sans-serif`
- **Source:** https://fonts.google.com/specimen/Montserrat
- **Use for:** alternative heading face when Saira Condensed feels too
  narrow; banners and accent labels needing maximum visual weight.

## Roboto Slab (Light 300, Bold 700)

- **Family:** `Roboto Slab`
- **Weights:** `300` (Light) for body, `700` (Bold) for emphasis
- **Fallback stack:** `serif`
- **Source:** https://fonts.google.com/specimen/Roboto+Slab
- **Use for:** body copy, taglines, attribution, footers, any
  paragraph-length text. Italics are allowed at either weight.

## Embedding text in designs

Two acceptable patterns:

1. **Outlines (preferred for production).** Convert `<text>` to
   `<path>` before committing the final SVG so the design ships without
   needing the font files. Most editors offer "Object → Path" or
   `inkscape --export-text-to-path`.

2. **Live `<text>` with documented font.** Allowed during iteration.
   Every `<text>` element must explicitly set both `font-family` and
   `font-weight` to one of the combinations in the table above.

## For Claude Code

When generating SVGs, default to live `<text>` with:

- `font-family="Saira Condensed, Impact, sans-serif" font-weight="700"`
- `font-family="Montserrat, Impact, sans-serif" font-weight="900"`
- `font-family="Roboto Slab, serif" font-weight="300"` (body)
- `font-family="Roboto Slab, serif" font-weight="700"` (emphasis)

Never emit `font-weight="800"`, `400`, `500`, etc. — they aren't on the
brand spec. A human or script will convert to outlines before final
print export.

## Vendoring

We don't vendor font files in this repo. If we ever need offline /
deterministic builds, drop `.woff2` files into `brand/fonts/files/`
(create the folder) and update this document with exact versions.
