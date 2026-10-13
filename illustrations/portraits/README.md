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

Status: **candidates**. The chapter picks a treatment; the others get
deleted.

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

¹ Grey reads flat on the orange tee; a tone between ink and orange would sit
better there if that combination is wanted.

Things to know before picking:

- **Light lines on a black tee print a negative.** The drawings are dark
  lines and shading on paper; drawn in white or orange on black, the
  shadows become highlights (most visible on Coxon's cap brim).
- **The halftone screen is sized for print**: 0.85 mm cells (≈ 30 lines per
  inch) when the portrait prints 150 mm wide. A design that prints it
  much smaller or larger should regenerate it with a matching
  `HALFTONE_CELL_MM` so the dots still hold on fabric.
- **Sizes**: 100–480 KB each. Detailed line art, so well above the ~50 KB
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
Thresholds and sizes are constants at the top of the script.
