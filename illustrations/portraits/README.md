# Portraits

Hand-drawn portraits of important people in the AI-safety field, one folder
per person, each with the same set of versions (below). They are
commissioned from human illustrators and published under CC BY-SA 4.0, like
every design in this repo (see `LICENSE-DESIGNS`), with each illustrator's
agreement. Never AI-generated.

These are source material, not designs. A tee that uses one goes in
`designs/<slug>/` as usual: its README credits the illustrator, and any
quote next to a portrait is verbatim and sourced (Lane B rules).

| Folder     | Portrait        | Illustrator        |
| ---------- | --------------- | ------------------ |
| `bengio/`  | Yoshua Bengio   | LOB LAN (2026-10)  |
| `coxon/`   | Coxon           | LOB LAN (2026-10)  |
| `hawking/` | Stephen Hawking | LOB LAN (2026-10)  |
| `hinton/`  | Geoffrey Hinton | LOB LAN (2026-10)  |
| `russell/` | Stuart Russell  | LOB LAN (2026-10)  |

The illustrator's signature is part of every drawing: keep it.

<!-- TODO: LOB LAN's name and link, for the credit line in designs. -->

## Versions

| File              | Inks | Lines            | Shading                         | For tees        |
| ----------------- | ---- | ---------------- | ------------------------------- | --------------- |
| `lines.svg`       | 1    | ink `#111111`    | dropped (darkest hatching only) | white, orange   |
| `halftone.svg`    | 1    | ink `#111111`    | 45° dot screen, same ink        | white, orange   |
| `tone.svg`        | 2    | ink `#111111`    | flat grey `#9B9B9B`             | white (orange¹) |
| `tone.orange.svg` | 2    | orange `#FF9416` | flat `#7A4D18`                  | black           |
| `tone.white.svg`  | 2    | white `#FFFFFF`  | flat grey `#7A7A7A`             | black           |

Each shading tone is the line colour faded 58 % toward the tee it is meant
for, the way the grey is ink faded toward white
(`brand/tokens.json#illustrationColors.portraitTone*`).

¹ Grey reads flat on the orange tee. The web generator prints the tone
there as ink faded toward orange instead (`portraitToneInkOnOrange`).

### In designs and on the web generator

A design that uses a portrait names it in its `design.json`
(`"portrait": { "person": "hinton", "by": "LOB LAN", "order": 1 }`) and
prints it in a `<g id="portrait">` slot, authored with `lines.svg` (see
`scripts/draw-portrait-quotes.py`, which lays out every portrait-quote tee).
The repo's own prints and mockups use that line version.

On the web generator, all the designs of one person share a card, which
shows the one with the lowest `order` (0 when omitted) first. Next to the
title, a fanned stack of finish swatches (with the number of quotes, when
there are several) opens a menu with two sections:

- **Quote**: each design of that person, with a thumbnail and the start of
  the quote;
- **Finish**: the face in **lines**, **halftone** and **tone**, on the
  chosen tee.

Hovering or focusing an option previews it on the card: a quote crossfades
in, and a finish wipes across the face while the card zooms in on it (only
where the pointer can hover; on touch screens there's no zoom). Choosing an
option picks it. The generator swaps the chosen file into the slot
(`packages/core/src/portrait.ts`):

- lines and dots are body ink, so they follow the tee's colour rule like
  any other body element (white on dark tees);
- the tone is the body colour faded 58 % toward the tee. On the white and
  black tees that is exactly `tone.svg` and `tone.white.svg`, so those two
  files and `tone.orange.svg` are reference renders: the generator doesn't
  read the coloured ones.

Things to know when picking:

- **Light lines on a black tee print a negative.** The drawings are dark
  lines and shading on paper; drawn in white or orange on black, the
  shadows become highlights (most visible on Coxon's cap brim).
- **The halftone screen is sized for print**: 0.85 mm cells (≈ 30 lines per
  inch) and no dot under 0.2 mm, at the width the portraits print on the
  portrait-quote tees (103–108 mm; `HALFTONE_PRINT_WIDTH_MM = 106` in
  `scripts/trace-portraits.py`). A design that prints them at a very
  different size should change that and re-run the tracer, so the dots still
  hold on fabric.
- **Sizes**: 100–430 KB each. Detailed line art, so well above the ~50 KB
  of a simple mark; fine for print and for the web generator.

## Regenerating

The illustrators' rasters (LOB LAN's: A4 JPEGs at 300 dpi) are not in the
repo: SVG is the source of truth, and the originals stay with whoever keeps
the chapter's files. With them in a folder, each named after its person
folder (`hinton.jpeg` → `hinton/`):

```sh
brew install potrace          # once; Pillow comes with the pipeline deps
python3 scripts/trace-portraits.py path/to/originals illustrations/portraits
```

The script crops each drawing, traces the line work and the shading
separately with potrace (dropping the soft grey edge of every line, so
lines don't get a grey rim) and writes all five versions into the person's
folder. It only touches the people whose drawings you pass it.
Thresholds and sizes are constants at the top of the script. With the pinned
Pillow (`scripts/requirements.txt`) and potrace 1.16, a re-run reproduces
the committed files byte for byte, so it only changes what you changed.
