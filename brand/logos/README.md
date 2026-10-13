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
  brand orange, with its ñ-tilde and P bars drawn in white on top;
  "Pause" letters and the "en Español" sub-wordmark are white; "AI" and
  the ñ of "Español" stay orange. Nothing in it is a backing colour, so
  it reads the same on any dark surface.
- `pauseai-es-mark.svg` — **Mark only, no wordmark.** Clean orange
  circle (viewBox `0 0 905 929`) with the chapter's signature
  ñ-tilde decoration sitting on top of the mark — a curvy white
  shape that hints at the "ñ" of "Español". Two white rects render
  the P-stem counterforms. Built with `<circle>` + explicit white
  overlays (chapter construction style), as opposed to the global's
  evenodd-cutout compound path. For chapter favicons, social
  profile pictures, small chest prints.
- `pauseai-es-mono-{ink,white,orange}.svg`,
  `pauseai-es-mark-mono-{ink,white,orange}.svg` — **Single ink**,
  lockup and mark, in ink, white or brand orange. Generated; see
  [Single-ink variants](#single-ink-variants) below.

### PauseAI Global

Official PauseAI Global assets. Banner aspect (≈ 1280 × 449), with the
mark constructed as a single compound path (`fill-rule="evenodd"`) — much
leaner than the chapter SVGs above. Use these for content contributed
upstream to PauseAI Global, not chapter-specific.

In every banner variant the mark's P-stem cutouts are transparent, so
they show whatever surface the logo sits on.

- `pauseai-global-on-light.svg` — **For light backgrounds.** Mark in
  brand orange; "Pause" in black, "AI" in orange. No baked-in canvas
  fill.
- `pauseai-global-on-orange.svg` — **For `#FF9416` brand-orange
  surfaces.** Mark and "AI" in white; "Pause" in black. Cutouts are
  transparent, so the orange surface shows through them naturally.
- `pauseai-global-on-dark.svg` — **For dark backgrounds.** Mark stays
  in brand orange; "Pause" in white, "AI" in orange.
- `pauseai-global-mark.svg` — **Mark only, no wordmark.** Square
  canvas (654 × 654). For favicons, social profile pictures, small
  chest prints, app icons. White ellipse behind the orange mark, so
  the P-stem cutouts always read white regardless of where the SVG
  sits. No ñ-tilde — see `pauseai-es-mark.svg` for the chapter
  version with the Spanish-flavored ñ accent.
- `pauseai-global-mono-{ink,white,orange}.svg`,
  `pauseai-global-mark-mono-{ink,white,orange}.svg` — **Single ink**,
  lockup and mark, in ink, white or brand orange. Generated; see
  [Single-ink variants](#single-ink-variants) below.

## Single-ink variants

Every lockup and mark in one flat colour. The mark's cutouts (the P
bars, plus the ñ-tilde in the ES files) are transparent, so the surface
shows through. **Generated** by `scripts/build-mono-logos.py`; don't
edit them by hand, re-run the script.

| Colour | Lockup | Mark | Fill (ES / global) | For |
|---|---|---|---|---|
| ink | `pauseai-*-mono-ink.svg` | `pauseai-*-mark-mono-ink.svg` | `#111111` / `black` | pale backgrounds where neither orange nor white reads (yellow, pastels, light greys) |
| white | `pauseai-*-mono-white.svg` | `pauseai-*-mark-mono-white.svg` | `#FFFFFF` / `white` | dark or busy backgrounds (black, navy, deep colours, photos) |
| orange | `pauseai-*-mono-orange.svg` | `pauseai-*-mark-mono-orange.svg` | `#FF9416` | brand orange alone, on white, grey or black |

Any of them also works for a one-colour screen print. The tee backs
put `pauseai-*-mark-mono-ink.svg` in the centre of the QR, in the back's
own colour (`scripts/build-qr.py`, `packages/core/src/back.ts`).

How they're built:

- **Lockups** come from `pauseai-*-on-orange.svg`, whose mark cutouts
  are already transparent: every fill becomes the one colour. In one
  colour, a letter that touches the circle would merge into it (the P
  of PAUSE and the E of EN in the ES lockup, the P of "Pause" in the
  global one), so the script trims a thin gap (≈ 1 mm when the logo
  prints 150 mm wide) out of the circle around them. Letter paths are
  unchanged.
- **Marks** come from `pauseai-*-mark.svg`. The white shapes painted
  over the ES circle (the ñ-tilde and the P bars) become holes in it,
  all in one even-odd path. The white ellipse behind the global mark
  is dropped, since the mark's P bars are already cut out. Geometry is
  unchanged.

## Adding more

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

One deliberate difference: upstream's light and dark banners put a
white / black rect behind the mark's P bars. Ours drop it (2026-10), so
the bars show the surface instead of printing as stray white or black on
any other colour (an extra ink on a tee). Drop it again when refreshing.
