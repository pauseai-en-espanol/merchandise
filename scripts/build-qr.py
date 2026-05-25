#!/usr/bin/env python3
"""
Build a stylized SVG QR code for the chapter URLs.

Two languages, two base URLs:
  - ES (chapter)  → https://pauseai.es     chapter mark in the QR centre
  - EN (global)   → https://pauseai.info   global mark in the QR centre

Tee backs render the QR + wordmark in a single foreground colour, with
no background panel — the tee fabric shows through "light" areas:
  - orange / white tee → ink (#111111)
  - black tee          → paper (#FFFFFF)
The finder patterns are drawn as hollow rings + centre dots (a path
with fill-rule="evenodd") so the dark/light/dark scan pattern reads
against the bare tee. The centre brand mark is recoloured to match:
the orange circle becomes the foreground colour and the white
decorations become transparent (so the ñ-tilde + P-stem counterforms
show as tee colour). Error correction H (30 %) carries the centre
logo without breaking scannability.

The standalone brand QR (brand/qr-pauseai-{es,info}.svg) keeps the
original darker-orange-on-white treatment so it remains usable in
posters / slides where a white background is expected.

Tracking: each tee back encodes a UTM-tagged URL, in two flavours —
  campaign-only    …/?utm_campaign=tshirt
      identical across every design → a single cheap *shared* back.
  campaign+source  …/?utm_campaign=tshirt&utm_source=tee-<design>
      unique per design → its own screen; print only when volume warrants.
The visible wordmark stays clean (PAUSEAI.ES); the UTM rides in the QR only.

Outputs:
  brand/qr-pauseai-{es,info}.svg                standalone brand QR (clean)
  designs/<slug>/<lang>.<tee>.back.svg          campaign-only (shared)
  designs/<slug>/<lang>.<tee>.back.sourced.svg  campaign+source (per design)
where <lang> ∈ {es,en}, <tee> ∈ {orange,white,black}.

Run from the repo root:
    python3 scripts/build-qr.py
"""
import re
import sys
from pathlib import Path

try:
    import qrcode
    import qrcode.constants
except ImportError:
    sys.exit("pip install qrcode (or apt install python3-qrcode)")

ROOT = Path(__file__).resolve().parent.parent
WHITE = "#FFFFFF"
INK = "#111111"
ORANGE = "#FF9416"      # brand orange — front/statement art only
QR_ORANGE = "#B85400"   # darker apparel-safe orange — standalone QR only

# Per-tee foreground for the back QR + wordmark. The tee fabric is the
# background; "light" areas in the QR render as tee colour.
FG_COLOR = {
    "orange": INK,
    "white":  INK,
    "black":  WHITE,
}

# --- Tracking (UTM) -------------------------------------------------------
CAMPAIGN = "tshirt"

# Curated short utm_source per design folder — kept terse because they show
# up verbatim in analytics. Add one line per new design; any folder missing
# here falls back to tee-<folder> with a warning.
SOURCE_NAMES = {
    "altman-fin-del-mundo": "tee-altman",
    "p-doom-evidencia":     "tee-pdoom",
    "preguntame":           "tee-preguntame",
    "cais-extincion":       "tee-cais",
    "si-alguien-la-crea":   "tee-sialguien",
}


def _xml(s):
    """Escape a URL for use in XML text/attributes (only & matters here)."""
    return s.replace("&", "&amp;")


# Per-language config: URL, wordmark label, centre-mark logo, output basenames
LANGUAGES = {
    "es": {
        "url": "https://pauseai.es",
        "wordmark": "PAUSEAI.ES",
        "mark_path": "brand/logos/pauseai-es-mark.svg",
        "qr_filename": "brand/qr-pauseai-es.svg",
        "lang": "es",
    },
    "en": {
        "url": "https://pauseai.info",
        "wordmark": "PAUSEAI.INFO",
        "mark_path": "brand/logos/pauseai-global-mark.svg",
        "qr_filename": "brand/qr-pauseai-info.svg",
        "lang": "en",
    },
}


def _load_mark(path):
    """Return (viewBox, inner-content) of a mark SVG."""
    svg = (ROOT / path).read_text()
    vb = re.search(r'viewBox="([^"]+)"', svg)
    vb = vb.group(1) if vb else "0 0 1 1"
    s = re.sub(r"<\?xml[^?]*\?>", "", svg)
    s = re.sub(r"<!--.*?-->", "", s, flags=re.DOTALL)
    m = re.search(r"<svg[^>]*>(.*)</svg>", s, flags=re.DOTALL)
    return vb, (m.group(1).strip() if m else "")


def _recolor_mark(mark_inner, fg_color, mark_vb):
    """Monochrome recolour for the bare-tee back QR. The two brand
    marks have different structures, so the transformation differs:

      - ES chapter mark: orange `<circle>` + separate white decoration
        shapes (ñ-tilde `<path>` + two P-stem `<rect>`s). The white
        shapes sit ON TOP of the circle, so just setting their fill to
        'none' makes them invisible without cutting anything — the
        circle stays solid. We wrap the (recoloured) circle in a
        `<mask>` containing the decoration shapes filled black, so
        they become real cutouts and the tee shows through.
      - Global mark: white backing `<ellipse>` + a compound orange
        path that already carves the P-stem cutouts via
        `fill-rule="evenodd"`. Dropping the ellipse's fill to 'none'
        is enough — the compound path's own cutouts then reveal the
        tee."""
    if "<circle" in mark_inner:
        return _recolor_es_mark(mark_inner, fg_color, mark_vb)
    return _recolor_global_mark(mark_inner, fg_color)


def _recolor_es_mark(mark_inner, fg_color, mark_vb):
    vb_parts = mark_vb.split()
    vb_w, vb_h = float(vb_parts[2]), float(vb_parts[3])

    circle_m = re.search(r'<circle[^/]*?fill="#FF9416"[^/]*/>', mark_inner)
    if not circle_m:
        raise ValueError("ES mark: expected an orange <circle>")
    circle = (
        circle_m.group(0)
        .replace("#FF9416", fg_color)
        .replace("/>", ' mask="url(#es-mark-cutouts)"/>')
    )

    decorations = re.findall(
        r'<(?:path|rect)[^/]*?fill="#FFFFFF"[^/]*/>', mark_inner
    )
    if not decorations:
        raise ValueError("ES mark: expected white decoration shapes")
    mask_shapes = [d.replace("#FFFFFF", "black") for d in decorations]

    return (
        "<defs>"
        '<mask id="es-mark-cutouts" maskUnits="userSpaceOnUse">'
        f'<rect x="0" y="0" width="{vb_w}" height="{vb_h}" fill="white"/>'
        + "".join(mask_shapes)
        + "</mask>"
        "</defs>"
        + circle
    )


def _recolor_global_mark(mark_inner, fg_color):
    sentinel = "__FG__"
    s = mark_inner.replace("#FF9416", sentinel)
    s = s.replace('"white"', '"none"')
    s = s.replace(sentinel, fg_color)
    return s


def _build_qr_for(url, mark_vb, mark_inner, fg_color, bg_color):
    """Build the QR SVG.

    fg_color: data modules, finder rings, centre mark fill.
    bg_color: 'light' areas (outer panel, finder inner ring, behind
              centre mark). If None, those areas are transparent so the
              surface beneath shows through, and the centre mark is
              recoloured to drop its secondary white fills."""
    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=1, border=0,
    )
    qr.add_data(url)
    qr.make(fit=True)
    matrix = qr.get_matrix()
    size = len(matrix)

    def is_position_marker(r, c):
        return (
            (r < 7 and c < 7)
            or (r < 7 and c >= size - 7)
            or (r >= size - 7 and c < 7)
        )

    logo_size = max(5, size // 5)
    if logo_size % 2 == 0:
        logo_size += 1
    center = size // 2
    logo_min = center - logo_size // 2
    logo_max = logo_min + logo_size - 1

    def is_logo_zone(r, c):
        return logo_min <= r <= logo_max and logo_min <= c <= logo_max

    QUIET = 1
    extent = size + 2 * QUIET
    display_px = 800
    p = [
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="{-QUIET} {-QUIET} {extent} {extent}" '
        f'width="{display_px}" height="{display_px}">',
    ]
    if bg_color:
        p.append(
            f'  <rect x="{-QUIET}" y="{-QUIET}" '
            f'width="{extent}" height="{extent}" fill="{bg_color}"/>'
        )
    p.append(f'  <g fill="{fg_color}">')
    for r in range(size):
        for c in range(size):
            if matrix[r][c] and not is_position_marker(r, c) and not is_logo_zone(r, c):
                p.append(f'    <rect x="{c}" y="{r}" width="1" height="1"/>')
    p.append("  </g>")
    for (mr, mc) in [(0, 0), (0, size - 7), (size - 7, 0)]:
        p.append(f'  <g transform="translate({mc} {mr})">')
        if bg_color:
            p.append(f'    <rect x="0" y="0" width="7" height="7" rx="1.5" fill="{fg_color}"/>')
            p.append(f'    <rect x="1" y="1" width="5" height="5" rx="1" fill="{bg_color}"/>')
            p.append(f'    <rect x="2" y="2" width="3" height="3" rx="0.5" fill="{fg_color}"/>')
        else:
            p.append(
                f'    <path fill="{fg_color}" fill-rule="evenodd" '
                f'd="M0,0 H7 V7 H0 Z M1,1 H6 V6 H1 Z"/>'
            )
            p.append(f'    <rect x="2" y="2" width="3" height="3" fill="{fg_color}"/>')
        p.append("  </g>")
    if bg_color:
        p.append(
            f'  <rect x="{logo_min}" y="{logo_min}" '
            f'width="{logo_size}" height="{logo_size}" fill="{fg_color}"/>'
        )
        mark_to_embed = mark_inner
    else:
        mark_to_embed = _recolor_mark(mark_inner, fg_color, mark_vb)
    p.append(
        f'  <svg x="{logo_min + 0.5}" y="{logo_min + 0.5}" '
        f'width="{logo_size - 1}" height="{logo_size - 1}" '
        f'viewBox="{mark_vb}">{mark_to_embed}</svg>'
    )
    p.append("</svg>")
    body = "\n".join(p)

    standalone = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f"<!-- Stylized QR for {_xml(url)} — generated by scripts/build-qr.py. Do not edit by hand. -->\n"
        + body + "\n"
    )
    m = re.search(r'<svg[^>]*viewBox="([^"]+)"[^>]*>(.*)</svg>', body, flags=re.DOTALL)
    return standalone, m.group(1), m.group(2).strip(), qr.version, size, logo_size


def build_back_svg(url, wordmark, qr_vb, qr_inner, tee):
    """Back template — single-colour QR + wordmark on bare tee."""
    fg = FG_COLOR[tee]
    u = _xml(url)
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<!--
  Back design ({wordmark}) — monochrome QR linking to {u}.
  Foreground follows the tee: ink on orange/white, paper on black.
  Regenerate with: python3 scripts/build-qr.py
  Layout (200 x 200 mm canvas):
    x=60..140, y=35..115  QR (80 x 80 mm) — single-colour modules,
                          hollow finders, recoloured mark; transparent
                          background so the tee shows through
    y=145                 Wordmark in the same fg colour as the QR
-->
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 200 200"
     width="200mm" height="200mm"
     role="img"
     aria-label="QR to {u}">
  <title>{u}</title>

  <svg id="qr" x="60" y="35" width="80" height="80" viewBox="{qr_vb}">
    {qr_inner}
  </svg>

  <text x="100" y="145"
        font-family="Saira Condensed, Impact, sans-serif"
        font-weight="700" font-size="15"
        fill="{fg}" text-anchor="middle">{wordmark}</text>
</svg>
"""


def main():
    design_dirs = sorted(
        d for d in (ROOT / "designs").iterdir()
        if d.is_dir() and not d.name.startswith("_")
    )

    for lang_code, cfg in LANGUAGES.items():
        base = cfg["url"]
        mark_vb, mark_inner = _load_mark(cfg["mark_path"])

        # 1) Standalone brand QR — unchanged: darker orange on a white
        #    panel. Generic asset for posters / slides, not for tees.
        standalone, _, _, qr_version, size, logo_size = _build_qr_for(
            base, mark_vb, mark_inner, QR_ORANGE, WHITE)
        (ROOT / cfg["qr_filename"]).write_text(standalone)
        print(f"[{lang_code}] brand QR v{qr_version} {size}x{size}, "
              f"logo {logo_size} (clean) → {cfg['qr_filename']}")

        # 2) Campaign-only QR — one per tee colour (each tee has its
        #    own foreground, so each tee's back SVG differs by colour).
        url_campaign = f"{base}/?utm_campaign={CAMPAIGN}"
        campaign_qrs = {
            tee: _build_qr_for(url_campaign, mark_vb, mark_inner,
                               FG_COLOR[tee], None)
            for tee in ("orange", "white", "black")
        }

        for design_dir in design_dirs:
            # 3) Campaign+source QR — unique per design (its own screen).
            source = SOURCE_NAMES.get(design_dir.name)
            if source is None:
                source = f"tee-{design_dir.name}"
                print(f"  ! {design_dir.name}: no curated utm_source, "
                      f"using '{source}' (add it to SOURCE_NAMES)")
            url_sourced = f"{base}/?utm_campaign={CAMPAIGN}&utm_source={source}"
            sourced_qrs = {
                tee: _build_qr_for(url_sourced, mark_vb, mark_inner,
                                   FG_COLOR[tee], None)
                for tee in ("orange", "white", "black")
            }

            for tee in ("orange", "white", "black"):
                stem = f"{cfg['lang']}.{tee}.back"
                _, vb_c, inner_c, *_ = campaign_qrs[tee]
                (design_dir / f"{stem}.svg").write_text(
                    build_back_svg(url_campaign, cfg["wordmark"],
                                   vb_c, inner_c, tee))
                _, vb_s, inner_s, *_ = sourced_qrs[tee]
                (design_dir / f"{stem}.sourced.svg").write_text(
                    build_back_svg(url_sourced, cfg["wordmark"],
                                   vb_s, inner_s, tee))
            print(f"  [{lang_code}] {design_dir.name}: {cfg['lang']}.*.back.svg "
                  f"(campaign) + .sourced.svg (src={source})")


if __name__ == "__main__":
    main()
