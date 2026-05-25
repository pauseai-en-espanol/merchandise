# Setup

What you need installed to develop and build this repo.

## TL;DR

```sh
# Python deps for the regular build pipeline
pip3 install --user fontTools qrcode pillow

# (Optional, one-time) install the chapter font so SVGs preview correctly
# in Safari / Preview / Quick Look. Printing does NOT need this.
cp brand/fonts/files/SairaCondensed-Bold.ttf ~/Library/Fonts/

# Run the full pipeline
./scripts/build-all.sh
```

Everything below is the detail behind those four lines.

## macOS tools (built-in)

| Tool | Used by | Purpose |
|---|---|---|
| `python3` (≥ 3.9) | every script | `/usr/bin/python3` ships with macOS Command Line Tools |
| `qlmanage` | `build-all.sh` | rasterizes mockup SVGs to PNG via WebKit |
| `xmllint` | sanity checks | validates SVG well-formedness |
| `fc-list` | manual debugging | lists installed fonts (helpful when previews look off) |
| `bash` | `build-all.sh` | the build script — `zsh` works too |

If `python3` is missing, install Xcode Command Line Tools:

```sh
xcode-select --install
```

## Python packages (regular pipeline)

| Package | Used by | Purpose |
|---|---|---|
| `fontTools` (≥ 4.60) | `scripts/print-export.py`, `scripts/text-to-outlines.py` | converts `<text>` to outline `<path>` for printer-ready SVGs |
| `qrcode` | `scripts/build-qr.py` | generates the QR matrix for the back design |
| `Pillow` (PIL) | `scripts/build-mockups.py`, `scripts/build-altman-fin-del-mundo.py` | raster manipulation for mockups + the raster-quote layer in altman |
| `numpy` | `scripts/build-altman-fin-del-mundo.py` | raster ops on the altman quote PNGs |

Install all in one command:

```sh
pip3 install --user fontTools qrcode pillow numpy
```

## Python packages (historical / onboarding)

Only needed if you're onboarding a new contributor PSD or vectorizing
a raster sketch. Not needed by `build-all.sh`.

| Package | Why |
|---|---|
| `psd-tools` | Extracts layers from contributor PSDs (used during the `altman-fin-del-mundo` onboarding) |
| `potracer` | Vector tracing of raster sketches (used to produce `designs/altman-fin-del-mundo/assets/stencil.svg` from the hand-drawn portrait) |

```sh
pip3 install --user psd-tools potracer
```

## Fonts

The chapter set uses **Saira Condensed Bold** for every text element
on every active design.

- The TTF lives in the repo: `brand/fonts/files/SairaCondensed-Bold.ttf`
- `scripts/print-export.py` reads it directly from there — printing
  does **not** require Saira Condensed to be installed on the OS.
- For direct SVG previewing in Safari, Preview, Quick Look, or any
  rasterization step (`qlmanage`), install it once into your user
  fonts:

  ```sh
  cp brand/fonts/files/SairaCondensed-Bold.ttf ~/Library/Fonts/
  ```

  Without this, Safari/QuickLook fall back to a generic sans-serif
  and the previews look wrong (advance widths are different, letter
  shapes wrong). The print exports are unaffected.

### Legacy: Bebas Neue

The `altman-fin-del-mundo` design's quote text is **embedded as raster
PNG** (see `designs/altman-fin-del-mundo/assets/quote-*.png`). Bebas
Neue does NOT need to be installed at any point.

### Italic

Saira Condensed Italic is not in the repo. Italic styles in the SVG
sources (e.g. `cais-extincion`'s attribution) are rendered:
- by Safari / Preview as **synthetic italic** (system skew) — looks
  acceptable for preview purposes
- by `scripts/print-export.py` as `skewX(-10°)` on the outlined paths
  — same effect, baked into the print file

## Optional: SVG → PDF

Print shops usually accept SVG directly. If yours specifically asks
for PDF:

### Path A — built-in macOS (no installs)

1. Open the SVG in Safari (drag it into the address bar)
2. File → Print (`⌘P`)
3. Bottom-left dropdown → **Save as PDF**
4. Save with the same basename as the SVG, `.pdf` extension

### Path B — automated with `cairosvg`

```sh
brew install cairo
pip3 install --user cairosvg
python3 -c "
import cairosvg
cairosvg.svg2pdf(url='prints/cais-extincion-front.svg',
                 write_to='prints/cais-extincion-front.pdf')
"
```

The Homebrew `cairo` install is the dependency `cairosvg` is missing
by default — without it you'll get `OSError: no library called "cairo-2"`.

## Build pipeline

After editing any `designs/<slug>/design.es.svg`, regenerate
everything with:

```sh
./scripts/build-all.sh
```

Stages:

1. `build-qr.py` — `back.svg` / `back.white.svg` / `back.black.svg`
   for every design folder
2. `build-<slug>.py` (one per design) — the per-tee colour variants
   `design.es.{white,black}.svg`
3. `build-mockups.py` — `mockups/<slug>/{lang}.{tee}.{side}.svg`
   composing each design over the JHK TSRA 170 tee photos, with all
   text outlined to `<path>` so the SVGs render identically anywhere
   (including GitHub) without depending on Saira Condensed
4. `qlmanage` — rasterizes every mockup SVG to PNG into
   `mockups/renders/<slug>/`
5. `print-export.py` — outlined-text print SVGs at chapter print
   sizes (24 × 24 cm fronts, 20 × 22 cm backs) into `prints/`

Skip stages with env vars:

```sh
SKIP_RENDERS=1 ./scripts/build-all.sh   # don't run qlmanage
SKIP_PRINT=1   ./scripts/build-all.sh   # don't refresh prints/
```

Onboarding a new design? See `designs/_template/` and copy that
folder, then rerun the pipeline. The script discovers slugs
dynamically from `designs/`.
