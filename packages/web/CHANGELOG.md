# @pauseai-es/merch-web

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
