# @pauseai-es/merch-web

## 1.6.2

### Patch Changes

- 306118d: Share links from the English page point their link preview at the right address (it was under /en/, which 404s).

## 1.6.1

### Patch Changes

- 01701e6: The preview server starts on x86-64: its image now has libatomic, which Node needs there.
- ef97686: The Text step points to a quote's short version when it has one, and warns when lines are emptied: the other lines
  keep their size, so shortening a quote by hand leaves it small. "Use the short line" switches to the short version.

## 1.6.0

### Minor Changes

- 410fe6b: Link previews now show the exact tee a share link describes: logo, text language, full or short, text colour, portrait
  finish, custom colours and edited text. A small preview server in the same image draws them (charts/static runs it as a
  second Deployment); if it's down, the static share pages answer. The logo and the site's name in the header now go home,
  so the logos page no longer needs its own way back.

## 1.5.0

### Minor Changes

- 6b0fb12: New "Text colour" option in step 2: highlighted words in colour, as drawn, or all the text in black (white on dark tees),
  leaving the brand colour only in the logo. For bright light and cameras, where a highlight may not read.

## 1.4.0

### Minor Changes

- e987a1e: Choosing a design is now two steps: a plain catalogue to pick it, then "Colour and options", where the tee colour, the
  quote, the version and the portrait finish are all in view as cards showing what each prints, instead of a menu on each
  card. The short version is offered only for the quote that has one.

## 1.3.1

### Patch Changes

- 3ee6295: The address bar now follows the tee as it's designed, so it's always the link to share. Link previews show the chosen
  tee colour and text language, not just the design. In a portrait card's menu, "Version" no longer vanishes while the
  pointer crosses a quote without a short line; picking the short line picks its quote.

## 1.3.0

### Minor Changes

- e84322e: Five portrait tees (Coxon, Hinton, Bengio, Hawking, Russell) get a short version: one line set large, to read from a
  distance, chosen on the card under "Version". And "Copy a link to this tee" shares the exact tee; each design's link
  shows that design in its link preview.

## 1.2.3

### Patch Changes

- a12d13b: Dependencies bump

## 1.2.2

### Patch Changes

- 9fe2ebe: The site's image build leaves out the portraits' original scans, now kept in the repo for re-tracing; the site itself is
  unchanged.
- acd5b38: Russell's "best case scenario" tee highlights "Chernobyl" and "regulate" too; in Spanish, words inside a line can now be
  highlighted (the editor shows them as `*…*`).

## 1.2.1

### Patch Changes

- 6fd6e87: The portraits' halftone finish now has its dot screen sized for the tees it prints on: 0.85 mm cells and no dot under
  0.2 mm at the portrait's printed width (about 106 mm), where the old screen came out at 0.6 mm with dots too small to
  hold on fabric.

## 1.2.0

### Minor Changes

- 13c8cd4: Portrait-quote tees: LOB LAN's hand-drawn portraits next to verified quotes from Hawking, Hinton, Bengio, Russell and
  Coxon, nine designs in all, one gallery card per person. Next to the card's title, a stack of finish swatches opens a
  menu with that person's quotes and three finishes for the portrait: lines, halftone (dots) or tone (a second ink, the
  line colour faded toward the tee). Hovering an option previews it on the card. The gallery cards are bigger (three per
  row on a desktop), and "Cites sources" is now a book icon that links to the design's notes. The preview zooms with the
  usual touch gestures: pinch, drag and double-tap. The print sheet names the finish and credits the illustrator.

### Patch Changes

- Updated dependencies [13c8cd4]
  - @pauseai-es/merch-core@1.2.0

## 1.1.2

### Patch Changes

- 3330586: The image builds on Node.js 26.12.1, with the dependency bumps (React 19.3.1 among them).

## 1.1.1

### Patch Changes

- 2cd4c79: Printing a design with the other logo family keeps the logo's width: the global logo on a Spanish design no longer shrinks
  into the chapter logo's box (and the chapter logo on an English design is centred where the global one was).
- Updated dependencies [2cd4c79]
  - @pauseai-es/merch-core@1.1.1

## 1.1.0

### Minor Changes

- 53c159a: A logos page (`#logos`) where anyone downloads every PauseAI lockup and mark, both families, as SVG or PNG, one by one
  or as a ZIP per family. The back's QR centre is now the single-ink mark (no SVG mask), and the global logo's P bars show
  the tee instead of printing white or black on light and dark tees.

### Patch Changes

- Updated dependencies [53c159a]
  - @pauseai-es/merch-core@1.1.0
