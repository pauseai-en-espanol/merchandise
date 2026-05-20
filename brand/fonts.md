# Fonts

PauseAI uses two libre fonts, both available from Google Fonts under the
[SIL Open Font License 1.1](https://scripts.sil.org/OFL):

## Body — Roboto Slab

- **Family:** Roboto Slab
- **Fallback stack:** `serif`
- **Source:** https://fonts.google.com/specimen/Roboto+Slab
- **Use for:** body copy, taglines, paragraph-length text on designs

## Display — Saira Condensed

- **Family:** Saira Condensed
- **Fallback stack:** `Impact, sans-serif`
- **Source:** https://fonts.google.com/specimen/Saira+Condensed
- **Use for:** large headings, wordmarks, short slogans

## Embedding text in designs

Two acceptable patterns:

1. **Outlines (preferred for production).** Convert `<text>` to `<path>`
   before committing the final SVG. This makes the design portable across
   printers and removes the need to ship the font. Most browsers/editors
   can do this via "Object → Path" or `inkscape --export-text-to-path`.

2. **Live `<text>` with documented font.** Allowed during iteration. The
   SVG must set `font-family="Roboto Slab, serif"` or
   `font-family="Saira Condensed, Impact, sans-serif"` so the fallback is
   sensible if the font isn't available.

## For Claude Code

When generating SVGs, default to producing **live `<text>`** elements with
the brand font-family and a sensible fallback stack. A follow-up step (human
or script) will convert text to outlines before final print export. This
keeps designs editable as text and diffable in PRs.

## Vendoring

We don't vendor the font files in this repo. If we ever need offline /
deterministic builds, drop `.woff2` files into `brand/fonts/files/` and
update this document with the exact versions in use.
