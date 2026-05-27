#!/usr/bin/env python3
"""
Build self-contained mockup SVGs by compositing the PRINT-ready SVG onto
the matching tee photo.

For each prints/<slug>/<lang>.<tee>.<side>.svg that exists, writes:

    mockups/<slug>/<lang>.<tee>.<side>.svg

…with the matching tee photo base64-embedded and the print inlined at the
chest / back position. The print is already text-outlined by
scripts/print-export.py, so the mockup shows *exactly* what goes to the
printer: there is no second outlining pass here, and no font dependency.
Because the SVGs are self-contained (embedded photo + outlined paths), they
render identically in any renderer — a browser from file://, GitHub, or
qlmanage — without Saira Condensed installed.

Run print-export.py BEFORE this script so the prints exist (build-all.sh
orders the stages). Rasterize the mockups to PNG with qlmanage into
mockups/renders/.

Run from the repo root:
    python3 scripts/build-mockups.py
"""
import base64
import pathlib
import re
import sys
from xml.etree import ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent.parent
MOCKUPS = ROOT / "mockups"
PRINTS = ROOT / "prints"
NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", NS)

# Tee photos (JHK TSRA 170 catalog renders, 1242 x 1560 px each).
TEE_W, TEE_H = 1242, 1560

# Chest / upper-back print boxes in tee-photo pixel coords. Width is fixed;
# the box height follows each print's own aspect ratio so nothing is
# distorted (fronts are square 240×240, backs are 200×220). A fixed width
# keeps the on-tee scale identical across sides.
CHEST = dict(x=370, y=380, w=500)
BACK = dict(x=370, y=340, w=500)

COLORS = ["orange", "white", "black"]


def tee_path(color: str, side: str) -> pathlib.Path:
    return MOCKUPS / f"tshirt-{color}-{side}.jpg"


def data_uri(path: pathlib.Path, mime: str) -> str:
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode('ascii')}"


def print_inner(svg_text: str):
    """Return (viewBox, inner-XML) for an (already outlined) print SVG —
    the serialized children of the outer <svg>, ready to embed."""
    root = ET.fromstring(svg_text)
    vb = root.get("viewBox")
    if not vb:
        raise ValueError("print SVG has no viewBox")
    serialized = ET.tostring(root, encoding="unicode")
    m = re.search(r"<svg[^>]*>(.*)</svg>\s*$", serialized, flags=re.DOTALL)
    if not m:
        raise ValueError("serialized SVG has no outer wrapper")
    return vb, m.group(1).strip()


def build_mockup(tee_uri: str, vb: str, inner: str, pos: dict) -> str:
    vb_w, vb_h = (float(v) for v in vb.split()[2:4])
    box_h = pos["w"] * vb_h / vb_w  # keep the print's aspect ratio
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="{NS}" viewBox="0 0 {TEE_W} {TEE_H}" '
        f'width="{TEE_W}" height="{TEE_H}">\n'
        f'  <image href="{tee_uri}" x="0" y="0" '
        f'width="{TEE_W}" height="{TEE_H}"/>\n'
        f'  <svg x="{pos["x"]}" y="{pos["y"]}" '
        f'width="{pos["w"]}" height="{box_h:.2f}" '
        f'viewBox="{vb}">\n{inner}\n  </svg>\n'
        "</svg>\n"
    )


def main():
    for print_dir in sorted(PRINTS.iterdir()):
        if not print_dir.is_dir():
            continue
        slug = print_dir.name
        out_dir = MOCKUPS / slug
        for lang in ("es", "en"):
            lang_built = False
            for color in COLORS:
                for side in ("front", "back"):
                    src = print_dir / f"{lang}.{color}.{side}.svg"
                    if not src.exists():
                        continue
                    tee = tee_path(color, side)
                    if not tee.exists():
                        print(f"  skip {slug}/{lang}/{color}/{side}: "
                              f"{tee} missing", file=sys.stderr)
                        continue
                    out_dir.mkdir(parents=True, exist_ok=True)
                    vb, inner = print_inner(src.read_text())
                    pos = CHEST if side == "front" else BACK
                    tee_uri = data_uri(tee, "image/jpeg")
                    out = out_dir / f"{lang}.{color}.{side}.svg"
                    out.write_text(build_mockup(tee_uri, vb, inner, pos))
                    lang_built = True
            if lang_built:
                print(f"  {slug} [{lang}]: built mockups from prints")


if __name__ == "__main__":
    main()
