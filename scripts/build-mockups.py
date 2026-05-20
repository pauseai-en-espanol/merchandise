#!/usr/bin/env python3
"""
Build self-contained mockup SVGs for every (design, tee color, side).

For each `designs/<slug>/` and each tee color in {orange, white, black}
and each side in {front, back}, writes:

    designs/<slug>/mockup-<color>-<side>.svg

…with the matching tee photo base64-embedded and the matching design
variant inlined at the chest / back print position.

Mockup SVGs are self-contained (no external file references), so they
render correctly from file:// in any browser. Run them through qlmanage
(or another rasterizer) to produce PNGs in mockups/renders/.

Run from the repo root:
    python3 scripts/build-mockups.py
"""
import base64
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
MOCKUPS = ROOT / "mockups"
DESIGNS_DIR = ROOT / "designs"

# Tee photos (JHK TSRA 170 catalog renders, 1242 x 1560 px each).
TEE_W, TEE_H = 1242, 1560
CANVAS = max(TEE_W, TEE_H)
TEE_OFFSET_X = (CANVAS - TEE_W) // 2

# Chest / upper-back print positions in tee-photo pixel coords.
# Edit these constants if the blank changes or placement needs nudging.
CHEST = dict(x=370, y=380, w=500, h=500)
BACK  = dict(x=370, y=340, w=500, h=500)

COLORS = ["orange", "white", "black"]


def tee_path(color: str, side: str) -> pathlib.Path:
    return MOCKUPS / f"tshirt-{color}-{side}.jpg"


def design_path(design_dir: pathlib.Path, color: str, side: str) -> pathlib.Path:
    """Resolve the SVG to embed for a given color/side. Falls back to the
    canonical orange variant when a color-specific file is missing."""
    if side == "front":
        candidates = [
            design_dir / f"design.es.{color}.svg",
            design_dir / "design.es.svg",
        ]
    else:  # back
        candidates = [
            design_dir / f"back.{color}.svg",
            design_dir / "back.svg",
        ]
    if color == "orange":
        # The orange variant IS the canonical file; skip the per-color name.
        candidates = candidates[-1:]
    for c in candidates:
        if c.exists():
            return c
    raise FileNotFoundError(f"no source SVG for {design_dir.name} / {color} / {side}")


def data_uri(path: pathlib.Path, mime: str) -> str:
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode('ascii')}"


def extract_inner(svg_text: str):
    s = re.sub(r"<\?xml[^?]*\?>", "", svg_text)
    s = re.sub(r"<!--.*?-->", "", s, flags=re.DOTALL)
    m = re.search(r'<svg[^>]*viewBox="([^"]+)"[^>]*>(.*)</svg>', s, flags=re.DOTALL)
    if not m:
        raise ValueError("no <svg viewBox=...> found")
    return m.group(1), m.group(2).strip()


def build_mockup(tee_uri: str, design_vb: str, design_inner: str, pos: dict) -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {CANVAS} {CANVAS}" '
        f'width="{CANVAS}" height="{CANVAS}">\n'
        f'  <image href="{tee_uri}" '
        f'x="{TEE_OFFSET_X}" y="0" width="{TEE_W}" height="{TEE_H}"/>\n'
        f'  <svg x="{TEE_OFFSET_X + pos["x"]}" y="{pos["y"]}" '
        f'width="{pos["w"]}" height="{pos["h"]}" '
        f'viewBox="{design_vb}">\n{design_inner}\n  </svg>\n'
        "</svg>\n"
    )


def main():
    for design_dir in sorted(DESIGNS_DIR.iterdir()):
        if not design_dir.is_dir() or design_dir.name.startswith("_"):
            continue
        for color in COLORS:
            for side in ("front", "back"):
                tee = tee_path(color, side)
                if not tee.exists():
                    print(f"  skip {design_dir.name}/{color}/{side}: {tee} missing", file=sys.stderr)
                    continue
                tee_uri = data_uri(tee, "image/jpeg")
                src = design_path(design_dir, color, side)
                vb, inner = extract_inner(src.read_text())
                pos = CHEST if side == "front" else BACK
                out = design_dir / f"mockup-{color}-{side}.svg"
                out.write_text(build_mockup(tee_uri, vb, inner, pos))
            print(f"  {design_dir.name}: built mockups for {color}")


if __name__ == "__main__":
    main()
