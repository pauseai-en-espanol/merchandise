# Logos

Canonical PauseAI logos. **Do not modify these files** when authoring designs
— reference or import them instead.

## Files

### PauseAI en Español (chapter)

- `pauseai-es-on-light.svg` — **For light backgrounds.** PauseAI mark +
  "PauseAI" wordmark + "en Español" sub-wordmark, with the ñ and its
  tilde in brand orange. Extracted from
  [`pauseai-website-es`](https://github.com/PauseAI/pauseai-website-es)'s
  logo component. Brand orange (`#FF9416`) mark + ink (`#111`) wordmark.
- `pauseai-es-on-orange.svg` — **For dark-orange backgrounds.** Brand-mark
  fill is white; the counterforms (and the eye-smile detail inside the
  mark) are transparent, so the dark-orange background shows through as
  natural cutouts. Wordmark stays in ink. Designed for `#C45A00`
  (`brand/tokens.json#colors.orangeDeep`) or similar burnt-orange.
- `pauseai-es-on-dark.svg` — **For dark backgrounds.** Mark stays in
  brand orange; the smile detail stays white; "Pause" letters and the
  "en Español" sub-wordmark are white; "AI" letters stay orange. The
  mark's counterform rects *and* the ñ body + its tilde are black, so
  they all read as cutouts/negative space on near-black surfaces.
- `pauseai-es-mark.svg` — **Mark only, no wordmark.** Clean orange
  circle (viewBox `0 0 905 929`) with the chapter's signature
  ñ-tilde decoration sitting on top of the mark — a curvy white
  shape that hints at the "ñ" of "Español". Two white rects render
  the P-stem counterforms. Built with `<circle>` + explicit white
  overlays (chapter construction style), as opposed to the global's
  evenodd-cutout compound path. For chapter favicons, social
  profile pictures, small chest prints.

### PauseAI Global

Official PauseAI Global assets. Banner aspect (≈ 1280 × 449), with the
mark constructed as a single compound path (`fill-rule="evenodd"`) — much
leaner than the chapter SVGs above. Use these for content contributed
upstream to PauseAI Global, not chapter-specific.

Each banner variant embeds its own backing-color strategy so the mark's
P-stem cutouts render consistently regardless of the surface beneath.

- `pauseai-global-on-light.svg` — **For light backgrounds.** Mark in
  brand orange; "Pause" in black, "AI" in orange. White backing rect
  behind the mark cutouts. No baked-in canvas fill.
- `pauseai-global-on-orange.svg` — **For `#FF9416` brand-orange
  surfaces.** Mark and "AI" in white; "Pause" in black. Cutouts are
  transparent, so the orange surface shows through them naturally.
- `pauseai-global-on-dark.svg` — **For dark backgrounds.** Mark stays
  in brand orange; "Pause" in white, "AI" in orange. Black backing
  rect behind the cutouts — looks cleanest on near-black surfaces; on
  navy/dark-gray the cutouts will read slightly darker than the bg.
- `pauseai-global-mark.svg` — **Mark only, no wordmark.** Square
  canvas (654 × 654). For favicons, social profile pictures, small
  chest prints, app icons. White ellipse behind the orange mark, so
  the P-stem cutouts always read white regardless of where the SVG
  sits. No ñ-tilde — see `pauseai-es-mark.svg` for the chapter
  version with the Spanish-flavored ñ accent.

## Adding more

Other variants we may want over time:

- `pauseai-*-mono-white.svg` / `pauseai-*-mono-ink.svg` — single-color
  versions for one-color screen printing on apparel.

Add each new file to this README and pick colors from
`brand/tokens.json`.

## A note on construction quality

The two `pauseai-es*` chapter files (≈ 15 KB each) are about 3× larger
than the global ones (≈ 4 KB each). Same logo, different construction:
the globals use a single `fill-rule="evenodd"` compound path for the
mark + cutouts, while the chapter files were extracted from
`pauseai-website-es`'s Svelte component as many separate Bézier paths
with high coordinate precision. Both render identically — the chapter
files are just heavier. If PauseAI Global ever publishes a clean ES
lockup (or PauseAI ES shares the original source), we should swap.

## Source upstream

The global SVGs in this folder are local copies of PauseAI Global's
official brand assets. If the upstream evolves, refresh these files
rather than editing them in place.
