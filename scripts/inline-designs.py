#\!/usr/bin/env python3
"""
Inline external <image href> references in each designs/<slug>/design.es.svg
so the file renders standalone in a browser (no file:// CORS issues) and
ships as a single self-contained SVG to print vendors.

Run from the repo root:
    python3 scripts/inline-designs.py

Re-run whenever brand/logos/* or any assets/* change.
"""
import base64, re, os, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

def load_svg_inner(path):
    s = pathlib.Path(path).read_text()
    m = re.search(r'viewBox="([^"]+)"', s)
    vb = m.group(1) if m else "0 0 100 100"
    s = re.sub(r'<\?xml[^?]*\?>', '', s)
    s = re.sub(r'<\!--.*?-->', '', s, flags=re.DOTALL)
    m = re.search(r'<svg[^>]*>(.*)</svg>', s, flags=re.DOTALL)
    return vb, (m.group(1).strip() if m else '')

def b64_uri(path, mime):
    data = pathlib.Path(path).read_bytes()
    return f"data:{mime};base64,{base64.b64encode(data).decode('ascii')}"

logo_vb, logo_inner = load_svg_inner(ROOT / 'brand/logos/pauseai-es-on-orange.svg')

for design_dir in (ROOT / 'designs').iterdir():
    if not design_dir.is_dir() or design_dir.name.startswith('_'):
        continue
    svg_path = design_dir / 'design.es.svg'
    if not svg_path.exists():
        continue
    s = svg_path.read_text()

    def repl_logo(m):
        attrs = m.group(0)
        x = re.search(r'\bx="([^"]+)"', attrs).group(1)
        y = re.search(r'\by="([^"]+)"', attrs).group(1)
        w = re.search(r'\bwidth="([^"]+)"', attrs).group(1)
        h = re.search(r'\bheight="([^"]+)"', attrs).group(1)
        return (f'<svg x="{x}" y="{y}" width="{w}" height="{h}" '
                f'viewBox="{logo_vb}">{logo_inner}</svg>')
    s = re.sub(
        r'<image\s+href="\.\./\.\./brand/logos/pauseai-es-on-orange\.svg"[^/]*/>',
        repl_logo, s)

    # Inline any local raster assets
    for m in list(re.finditer(r'href="(assets/[^"]+\.(png|jpg|jpeg))"', s)):
        rel = m.group(1)
        ext = m.group(2).lower()
        mime = 'image/png' if ext == 'png' else 'image/jpeg'
        uri = b64_uri(design_dir / rel, mime)
        s = s.replace(f'href="{rel}"', f'href="{uri}"')

    svg_path.write_text(s)
    print(f"inlined {svg_path}")
