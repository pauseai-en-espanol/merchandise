# Mockups

Photos of blank products used to visualize designs. Drop a design SVG on top
of one of these in any image editor (or with a future build script) to
produce a preview render.

## Adding a blank

When adding a new blank photo, also add a sibling `.json` file describing
where the design should be placed:

```json
{
  "product": "tshirt",
  "blank_color": "black",
  "view": "front",
  "image_size_px": [1600, 2000],
  "placement_px": { "x": 540, "y": 600, "width": 520, "height": 700 },
  "source": "where the photo came from / license"
}
```

This metadata is what a future build script will read to composite a
rendered SVG onto the blank automatically.

## What belongs here

- Photos of plain t-shirts, totes, stickers, etc., on neutral backgrounds.
- Royalty-free imagery or own-photography only — no scraped product photos
  with restricted licenses.

## What doesn't

- Rendered previews (those go in `/build/`, which is gitignored).
- Very large source PSDs (use a separate Git LFS strategy if ever needed;
  prefer JPG/PNG ≤ 2 MB).
