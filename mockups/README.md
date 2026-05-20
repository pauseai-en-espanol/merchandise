# Mockups

Photos of blank products used to visualize designs. Each is composited
under a design SVG by `scripts/build-mockups.py` to produce a preview
render in `mockups/renders/` (gitignored).

## Current blanks

The t-shirt blanks below are JHK Tshirt's **Regular T-Shirt (TSRA 170)**
model — the standard 170 g/m² cotton blank, the same product the
chapter intends to print on. All photos are JHK's official catalog
renders (1242 × 1560 px each):

| File                          | Color  | View  |
|-------------------------------|--------|-------|
| `tshirt-orange-front.jpg`     | Orange | Front |
| `tshirt-orange-back.jpg`      | Orange | Back  |
| `tshirt-white-front.jpg`      | White  | Front |
| `tshirt-white-back.jpg`       | White  | Back  |
| `tshirt-black-front.jpg`      | Black  | Front |
| `tshirt-black-back.jpg`       | Black  | Back  |

**Source:** JHK Tshirt — Regular T-Shirt (SKU: TSRA 170)
Catalog: <https://www.jhktshirt.com/en/catalog/>

These are vendor product photos used for design-layout mockups. They're
the manufacturer's own promotional renders of the blank we plan to
print on; do not redistribute them outside the context of evaluating
PauseAI ES merchandise designs.

## Adding a new blank

If we adopt a different product (tote, hoodie, sticker), drop the photo
in here and update `scripts/build-mockups.py` (or fork the constants in
that script) to point at the new file and the new print-area
coordinates. We may eventually want a sibling `.json` metadata file per
blank, but the current setup keeps placement constants centralized in
the build script — simpler while we have one product.

## What belongs here

- Photos of plain blanks (t-shirts, totes, etc.).
- Vendor product photos for blanks we'll actually print on, **or**
  royalty-free / own-photography.

## What doesn't

- Rendered previews — those go in `mockups/renders/` which is gitignored.
- Very large source PSDs (prefer JPG/PNG ≤ 2 MB; the JHK renders are
  ~1.5 MB each).
