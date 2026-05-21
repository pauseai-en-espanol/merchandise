#!/usr/bin/env python3
"""
Generate per-tee-color variants of every chest + back SVG.

Each `designs/<slug>/` is assumed to have an orange-tee canonical SVG
pair (`design.es.svg`, `back.svg`). This script reads each pair and
writes `.white.svg` / `.black.svg` siblings next to them, applying the
chapter's color rules:

  Tee       | DISPLAY (white in source) | BODY (ink in source) | Logo
  orange    | white                     | ink                  | pauseai-es-on-orange.svg
  white     | orange                    | ink (unchanged)      | pauseai-es-on-light.svg
  black     | orange                    | white                | pauseai-es-on-dark.svg

Implementation:
  - The inlined banner logo (nested <svg viewBox="0 0 3400 929">) is
    stripped before color-swapping and re-inserted from the matching
    brand/logos/* variant. This prevents the swap from corrupting the
    logo's internal white counterforms / ink wordmark fills.
  - The inlined QR block in back.svg (nested <svg viewBox="-1 -1 31 31">)
    is likewise preserved as-is — its own internal palette is correct on
    every tee color via the white scan panel + orange modules.
  - On the remaining SVG content, simple text-fill substitutions are
    applied.

Run from the repo root:
    python3 scripts/build-color-variants.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DESIGNS = ROOT / "designs"
LOGOS = ROOT / "brand" / "logos"

ORANGE = "#FF9416"
INK = "#111111"
WHITE = "#FFFFFF"

# Map tee color → logo file name + text-color swap rules.
# Each rule is (from_fill, to_fill). Order matters: apply in sequence.
COLOR_PROFILES = {
    "white": {
        "logo_file": "pauseai-es-on-light.svg",
        "swaps": [(WHITE, ORANGE)],  # display white → orange; ink stays ink
    },
    "black": {
        "logo_file": "pauseai-es-on-dark.svg",
        "swaps": [
            (WHITE, "__TEMP_DISPLAY__"),  # protect display marker
            (INK, WHITE),                  # body ink → white
            ("__TEMP_DISPLAY__", ORANGE),  # display → orange
        ],
    },
}

# Regex to find the inlined logo block (chapter banner aspect 3400 x 929).
LOGO_RE = re.compile(
    r'(<svg\b[^>]*viewBox="0 0 3400 929"[^>]*>)(.*?)(</svg>)',
    flags=re.DOTALL,
)
# Regex to find the inlined QR block in back.svg.
QR_RE = re.compile(
    r'(<svg\b[^>]*viewBox="-1 -1 31 31"[^>]*>)(.*?)(</svg>)',
    flags=re.DOTALL,
)


def read_logo_inner(filename: str) -> str:
    """Read a brand logo SVG, return just the inner content (no outer <svg>)."""
    s = (LOGOS / filename).read_text()
    s = re.sub(r"<\?xml[^?]*\?>", "", s)
    s = re.sub(r"<!--.*?-->", "", s, flags=re.DOTALL)
    m = re.search(r"<svg[^>]*>(.*)</svg>", s, flags=re.DOTALL)
    return m.group(1).strip() if m else ""


def apply_color_profile(svg_text: str, color: str) -> str:
    profile = COLOR_PROFILES[color]
    logo_inner_new = read_logo_inner(profile["logo_file"])

    # 1. Strip out preserved blocks (logo + optional QR) so their colors
    #    are not touched by the global text-fill swap.
    preserved: dict[str, str] = {}

    def preserve_logo(m: re.Match) -> str:
        # Build the replacement: keep outer tag + attrs (positions in
        # design canvas), substitute the inner content for the new
        # logo's content.
        outer_open = m.group(1)
        outer_close = m.group(3)
        replacement = outer_open + "\n" + logo_inner_new + "\n" + outer_close
        token = f"__PRESERVE_LOGO_{len(preserved)}__"
        preserved[token] = replacement
        return token

    def preserve_qr(m: re.Match) -> str:
        # Keep QR as-is — its palette is the same on every tee color.
        token = f"__PRESERVE_QR_{len(preserved)}__"
        preserved[token] = m.group(0)
        return token

    s = LOGO_RE.sub(preserve_logo, svg_text)
    s = QR_RE.sub(preserve_qr, s)

    # 2. Apply text-fill swaps on the remaining content.
    for from_color, to_color in profile["swaps"]:
        s = s.replace(f'fill="{from_color}"', f'fill="{to_color}"')

    # 3. Reinsert preserved blocks.
    for token, content in preserved.items():
        s = s.replace(token, content)

    return s


def process_design_folder(design_dir: Path) -> None:
    for source_name, label in [("design.es.svg", "chest"), ("back.svg", "back")]:
        source = design_dir / source_name
        if not source.exists():
            continue
        orange_svg = source.read_text()
        for color in COLOR_PROFILES:  # 'white', 'black'
            variant_name = source_name.replace(".svg", f".{color}.svg")
            (design_dir / variant_name).write_text(
                apply_color_profile(orange_svg, color)
            )
            print(f"  wrote {design_dir.name}/{variant_name}")


def main() -> None:
    for d in sorted(DESIGNS.iterdir()):
        if d.is_dir() and not d.name.startswith("_"):
            # altman-fin-del-mundo has raster-embedded layers that need a
            # pixel-level color swap, not just a text-fill substitution.
            # Its variants are produced by the design's own raster-aware
            # builder, so skip it here to avoid clobbering those outputs.
            if d.name == "altman-fin-del-mundo":
                continue
            process_design_folder(d)


if __name__ == "__main__":
    main()
