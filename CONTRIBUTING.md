# Contributing

Thanks for wanting to help PauseAI en Español!

## Adding a new design

1. **Copy the template:**
   ```sh
   cp -r designs/_template designs/<your-slug>
   ```
   Use a kebab-case slug that describes the *idea*, not the product:
   `pausa-wordmark`, `safe-ai-symbol`, `no-rush-frontier`.

2. **Fill in the design README** with intent, audience, target languages,
   and which products you'd like to see it on.

3. **Edit the SVG** (rename to `design.es.svg` / `design.en.svg` /
   `design.symbol.svg` as appropriate). Reference brand tokens — see
   [`brand/tokens.json`](./brand/tokens.json) and
   [`brand/guidelines.md`](./brand/guidelines.md).

4. **Preview** by opening the SVG in any browser, or dragging it onto a tab.

5. **Open a PR.** Include a screenshot of the SVG and ideally a quick mockup
   on a product blank (drop the SVG onto a photo from `mockups/` in any image
   editor).

## Working with Claude Code

This repo is set up so Claude Code can read the brand rules in
[`CLAUDE.md`](./CLAUDE.md), the brand tokens in `brand/tokens.json`, and the
product specs in `products/`, then propose a design as plain SVG. Typical
prompts:

- "Draft a t-shirt design around the idea of a paused timeline. Spanish copy."
- "Take `designs/pausa-wordmark/design.es.svg` and produce an English variant."
- "Make a sticker-sized variant of this design at 75×75 mm."

Claude will not modify the logos in `brand/logos/` — those are canonical.

## What to avoid

- Don't introduce new colors. Use the tokens in `brand/tokens.json`. If you
  genuinely need a new color, add it to the tokens file in the same PR and
  explain why.
- Don't modify or recolor `brand/logos/*`. If you need a logo treatment
  that doesn't exist there, open an issue first.
- Don't commit binary exports (`*.png`, `*.pdf`) — they belong in `build/`,
  which is gitignored. Mockup *source* photos in `mockups/` are the exception.
- Don't import non-libre fonts directly into SVGs. Fonts must be listed in
  `brand/fonts.md` or licensed for embedding.

## Reviewer checklist

- [ ] Slug is descriptive and kebab-case
- [ ] `README.md` filled out (intent, languages, products)
- [ ] All language variants present, or noted as TODO
- [ ] Brand tokens used; no hardcoded hex outside `brand/`
- [ ] Print area fits intended product per `products/*.yaml`
- [ ] Text is outlined for production, or font is documented in
      `brand/fonts.md`
