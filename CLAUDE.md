# Claude's brief for this repo

You're helping create open-source merchandise designs for **PauseAI en
Español**, the Spanish chapter of the global [PauseAI](https://pauseai.info)
movement. Designs may also be contributed upstream to PauseAI Global.

## What PauseAI stands for

A pause on the development of **frontier** AI systems until their safety
can be ensured.

## Two voice lanes

Designs can sit in either of two registers, depending on the audience and
the moment. Both share the underlying brand values listed further down.

### Lane A — Thoughtful policy conversation

Earnest, hopeful, serious. The wearer at a science museum, a policy
roundtable, a university talk. Inviting reflection without alarm.

Use for: educational materials, recruitment of the curious, conferences,
contexts where the goal is to start a calm conversation.

### Lane B — Accountability / protest

Direct, evidence-based, confrontational. The wearer at a rally, a public
action, or simply wanting to provoke a real conversation in a public
space. Puts AI lab leaders on the spot with their own verbatim public
statements, or surfaces uncomfortable industry data.

Use for: actions, protest events, public-outreach merch designed to spark
questions from strangers, t-shirts that need to do the heavy lifting of
starting the conversation without the wearer having to.

**Each design's README declares which lane it sits in** so contributors
can quickly see what's appropriate.

### Shared across both lanes

- **Quoted claims must be sourced.** Date, publication, link in the
  design's README. No paraphrasing, no editorial smoothing. If we can't
  verify it, we don't print it.
- **No mockery or caricature of individuals.** Quote them accurately;
  don't distort their face, words, or position. The point is
  accountability, not insult.
- **Real photos only, with attribution.** Never AI-generated portraits.
  If a design uses a person's likeness, the README cites the photo's
  source and license.
- **No catastrophe imagery.** Mushroom clouds, bombs, body counts,
  burning cities — out, regardless of lane. We argue for caution, not
  catastrophe-porn.
- **The PauseAI logos in `brand/logos/` are not modified.** Both lanes
  use the same brand marks.

## Authoring designs

- **SVG is the source of truth.** Author designs as text. No raster fallbacks
  in the source. No Figma / Illustrator / Photoshop files.
- **One folder per design** in `designs/`, with language variants as siblings:
  `design.es.svg`, `design.en.svg`, `design.symbol.svg`.
- **Start every new design by copying `designs/_template/`** — don't author
  ad-hoc folder layouts.
- **Reference brand tokens** (`brand/tokens.json`) — never hardcode brand
  colors outside that file.

## Brand rules

- **Primary color:** `#FF9416` (PauseAI orange). Use it as the dominant
  accent or as a brand-forward fill — never as small body text (poor
  contrast on apparel).
- **Ink:** prefer `#111111` over pure black to soften screen-print contrast.
- **Paper:** `#FFFFFF` for fills/backgrounds on dark items.
- **Logos in `brand/logos/` are canonical.** Do not recolor, redraw,
  re-letter, or distort. If a design needs a different logo treatment, open
  an issue first.
- **Typography:** Roboto Slab (body) and Saira Condensed (display). See
  `brand/fonts.md`. Default to live `<text>` elements during iteration;
  convert to outlines before final production export.
- **Clear-space rule:** keep at least the height of the logo's capital "P"
  as clear space on all sides of any logo placement.
- **No new colors** without updating `brand/tokens.json` first, in the same
  PR.

## Design constraints for print

- **Canvas in millimeters.** Default `viewBox="0 0 W H"` where W/H are the
  print area in mm. The same source then exports cleanly for any vendor.
- **Safe area.** Keep critical content away from edges: at least **5 mm** for
  apparel, **3 mm** for stickers. See `products/*.yaml`.
- **Two-color or single-color** designs print cheaper on apparel — prefer
  them unless the concept demands full color.
- **Hairlines.** Avoid strokes below `0.4 mm` — they vanish in screen print
  and DTG.
- **No embedded rasters** inside SVGs. If you need photographic texture,
  reconsider the design — pure vector reads better at any size.

## What "good" looks like

A good design folder has:
- a short README explaining the *idea* in one paragraph;
- the SVG using brand tokens consistently;
- language variants where text is involved;
- a note on which products in `products/*.yaml` it's intended for.

A good SVG is:
- viewable in a browser without warnings;
- under ~50 KB for simple marks (large = probably an embedded raster — fix);
- structured with `<g>` groups and meaningful `id`s (`#mark`, `#wordmark`,
  `#tagline`) so future variants can swap pieces independently.

## What to NEVER do

- Don't invent or modify PauseAI logos.
- Don't introduce new brand colors without updating `brand/tokens.json`.
- Don't embed raster images inside SVGs.
- Don't caricature or mock individuals — even in Lane B, quote accurately
  and let the words do the work.
- Don't paraphrase quotes. Verbatim or nothing.
- Don't use AI-generated photorealistic imagery — it undermines the
  movement's message about AI risk.
- Don't include catastrophe imagery (mushroom clouds, bombs, burning
  cities, body counts).
- Don't add `<script>`, tracking, or external `xlink:href` references
  inside SVGs.

## Adding a new design — the workflow

1. Copy `designs/_template/` to `designs/<slug>/`.
2. Edit the README to describe the idea, declare the **voice lane**
   (A or B), target languages, target products. If the design quotes
   anyone or cites data, list every source there with date + link.
3. Read `brand/tokens.json` and the relevant `products/<target>.yaml`
   first; design within those constraints.
4. Author the SVG. Preview in a browser. Iterate.
5. If text is involved, produce all language variants needed
   (`.es.svg`, `.en.svg`).
6. If the concept reads without text, also produce `.symbol.svg`.
7. For apparel with a back print (e.g., QR + URL), add `back.svg` in
   the same folder. The back is usually language-agnostic.
8. Update the design's README with what you produced and any caveats.
