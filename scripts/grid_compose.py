#!/usr/bin/env python3
"""
Typographic grid composition helpers — Psalm-style packed layouts where
every cell in a row has the same vertical span and every row has the
same horizontal span.

Used to author `designs/cais-extincion/design.es.svg`. The math is non-
obvious enough that doing it by hand is error-prone; this module
encapsulates the constraint solving so future designs can be 10 lines
of Python instead of 50 numbers.

Conventions assumed:
  - Cap-height ratio = 0.7 of the em (Saira Condensed Bold).
  - 1 SVG user-unit = 1 mm (designs use viewBox in mm).
  - Anchors set the row height (cap-height = row height).
  - Stacks fill the row height: sum of caps + leading = anchor cap.

Public API (functional, returns dicts so callers can shape the SVG):

    font   = grid_compose.load('brand/fonts/files/SairaCondensed-Bold.ttf')

    row1   = grid_compose.row_2col(font,
        left=grid_compose.Stack(['MITIGAR EL', 'RIESGO DE']),
        right=grid_compose.Anchor('EXTINCIÓN'),
        row_w=190, gap=4)

    row2   = grid_compose.row_3col(font,
        left=grid_compose.Stack(['POR', 'LA'], mode='diff_fonts'),
        middle=grid_compose.Anchor('IA'),
        right=grid_compose.Stack(['DEBERÍA', 'SER UNA']),
        row_w=190, gap=4)

    row3   = grid_compose.row_full(font, 'PRIORIDAD GLOBAL', row_w=190)

The caller arranges the rows vertically (picking y offsets) and emits
<text> elements from the returned `lines` lists.
"""
from dataclasses import dataclass, field
from pathlib import Path

from fontTools.ttLib import TTFont

CAP_RATIO = 0.7  # Saira Condensed Bold cap-height as fraction of em


# ---------- font helpers ----------

def load(path):
    return TTFont(str(path))


def _adv(font, text):
    """Sum of glyph advances in font units for `text`."""
    cmap = font.getBestCmap()
    hmtx = font['hmtx']
    return sum(hmtx[cmap[ord(c)]][0] for c in text if ord(c) in cmap)


def font_size_for_width(font, text, width_mm):
    """Point size at which `text` renders exactly `width_mm` wide."""
    a = _adv(font, text)
    return width_mm * font['head'].unitsPerEm / a if a else 0


def width_at_font_size(font, text, fs):
    """Rendered width of `text` at given font-size (mm)."""
    return _adv(font, text) * fs / font['head'].unitsPerEm


# ---------- cell types ----------

@dataclass
class Stack:
    """A stacked cell of N lines treated as a single visual block.

    mode='same_font'  — all lines at one font-size; textLength forces
                        equal width (only safe when natural widths are
                        within ~30% of each other).
    mode='diff_fonts' — each line gets its own font-size chosen so the
                        natural width equals the target. No letter-
                        spacing artefacts. Cap-heights differ → use
                        when you want the visual rhythm of mixed sizes.
    """
    texts: list
    mode: str = 'same_font'  # 'same_font' | 'diff_fonts'


@dataclass
class Anchor:
    """Single-line anchor that sets the row's vertical span."""
    text: str


# ---------- per-row composers ----------

@dataclass
class CellOut:
    lines: list = field(default_factory=list)  # list of dicts: text, font_size, x, y, anchor, textLength
    width: float = 0.0
    x_start: float = 0.0
    x_end: float = 0.0


@dataclass
class RowOut:
    cells: list = field(default_factory=list)  # list of CellOut
    height: float = 0.0
    row_width: float = 0.0


def _anchor_cell(font, anchor_text, target_w, x_anchor_at, anchor_mode='end'):
    """Compute an anchor cell sized to `target_w` width."""
    fs = font_size_for_width(font, anchor_text, target_w)
    cap = fs * CAP_RATIO
    cell = CellOut(width=target_w)
    if anchor_mode == 'end':
        cell.x_end = x_anchor_at
        cell.x_start = x_anchor_at - target_w
    elif anchor_mode == 'middle':
        cell.x_start = x_anchor_at - target_w / 2
        cell.x_end = x_anchor_at + target_w / 2
    else:  # 'start'
        cell.x_start = x_anchor_at
        cell.x_end = x_anchor_at + target_w
    cell.lines.append({
        'text': anchor_text, 'font_size': fs, 'x': x_anchor_at,
        'anchor': anchor_mode, 'cap_height': cap,
    })
    return cell


def _stack_cell_same_font(font, stack: Stack, target_w, x_start,
                          target_cap, anchor_mode='start'):
    """Stack with one font-size for all lines, textLength forces equal width."""
    max_adv = max(_adv(font, t) for t in stack.texts)
    fs = target_w * font['head'].unitsPerEm / max_adv
    cap = fs * CAP_RATIO
    n = len(stack.texts)
    leading = (target_cap - n * cap) / (n - 1) if n > 1 else 0

    cell = CellOut(width=target_w, x_start=x_start, x_end=x_start + target_w)
    y_baseline = cap  # first baseline measured from top of cell
    for i, t in enumerate(stack.texts):
        cell.lines.append({
            'text': t, 'font_size': fs, 'x': x_start,
            'anchor': anchor_mode, 'textLength': target_w,
            'y_offset': y_baseline, 'cap_height': cap,
        })
        if i < n - 1:
            y_baseline += cap + leading
    return cell, leading


def _stack_cell_diff_fonts(font, stack: Stack, target_w, x_start,
                           target_cap, anchor_mode='start'):
    """Stack with per-line font-sizes so each natural width = target_w.
    No textLength needed. Caps sum + leading = target_cap."""
    advances = [_adv(font, t) for t in stack.texts]
    upem = font['head'].unitsPerEm
    fonts = [target_w * upem / a for a in advances]
    caps = [f * CAP_RATIO for f in fonts]
    n = len(stack.texts)
    leading = (target_cap - sum(caps)) / (n - 1) if n > 1 else 0

    cell = CellOut(width=target_w, x_start=x_start, x_end=x_start + target_w)
    y_baseline = 0.0
    for i, (t, f, cap) in enumerate(zip(stack.texts, fonts, caps)):
        y_baseline += cap
        cell.lines.append({
            'text': t, 'font_size': f, 'x': x_start,
            'anchor': anchor_mode, 'y_offset': y_baseline,
            'cap_height': cap,
        })
        if i < n - 1:
            y_baseline += leading
    return cell, leading


def row_full(font, text, row_w, x_offset=5):
    """Single full-width line."""
    fs = font_size_for_width(font, text, row_w)
    cap = fs * CAP_RATIO
    cell = CellOut(width=row_w, x_start=x_offset, x_end=x_offset + row_w)
    cell.lines.append({
        'text': text, 'font_size': fs, 'x': x_offset + row_w / 2,
        'anchor': 'middle', 'y_offset': cap, 'cap_height': cap,
    })
    return RowOut(cells=[cell], height=cap, row_width=row_w)


def row_2col(font, left: Stack, right: Anchor, row_w, gap, x_offset=5):
    """LEFT stack | gap | RIGHT anchor.
    Anchor's font-size determined by remaining width after stack."""
    # Solve: small_fs * adv(max_left) / upem + gap + anchor_fs * adv(right) / upem = row_w
    # Constraint: 2*small_fs*CAP + leading = anchor_fs*CAP  →  anchor_fs ≈ 2.15*small_fs
    # (leading auto-adjusts; we use 2.15 as an estimate, refined below.)
    if len(left.texts) != 2:
        raise ValueError("row_2col expects a 2-line stack on the left")

    upem = font['head'].unitsPerEm
    max_left_adv = max(_adv(font, t) for t in left.texts)
    anchor_adv = _adv(font, right.text)

    # System: row_w = small_fs * (max_left_adv + 2.15 * anchor_adv) / upem + gap
    small_fs = (row_w - gap) / ((max_left_adv + 2.15 * anchor_adv) / upem)
    anchor_fs = 2.15 * small_fs
    anchor_cap = anchor_fs * CAP_RATIO
    target_w_left = small_fs * max_left_adv / upem

    left_cell, _ = _stack_cell_same_font(
        font, left, target_w_left, x_offset, anchor_cap, anchor_mode='start')
    right_x = x_offset + row_w
    right_cell = _anchor_cell(font, right.text,
                              target_w=row_w - target_w_left - gap,
                              x_anchor_at=right_x, anchor_mode='end')
    # Anchor baseline = top + cap
    right_cell.lines[0]['y_offset'] = anchor_cap

    return RowOut(cells=[left_cell, right_cell],
                  height=anchor_cap, row_width=row_w)


def row_3col(font, left: Stack, middle: Anchor, right: Stack,
             row_w, gap, x_offset=5, leading_left=2, leading_right=2):
    """LEFT stack | gap | MIDDLE anchor | gap | RIGHT stack.
    Middle anchor's width is whatever balances the row.
    Stacks use their declared mode (same_font or diff_fonts).
    """
    upem = font['head'].unitsPerEm
    adv_mid = _adv(font, middle.text)

    if left.mode == 'same_font':
        adv_L = max(_adv(font, t) for t in left.texts)
        coef_L = CAP_RATIO * len(left.texts) * 1000 / adv_L   # cap*n / W_L
        # leading from constraint: H = n*W_L*coef_L/n + (n-1)*leading
        # i.e. n*cap + (n-1)*leading = H  →  H = W_L * coef_L * (something)
        # Simpler: same_font with N lines: caps sum = n*cap. W_L*coef_L = n*cap_per_line.
        # cap_per_line = W_L*coef_L/n. So H - leading*(n-1) = n*cap = W_L*coef_L.
        # → W_L = (H - leading_left*(n-1)) / (coef_L/n)... actually let me redo.
        n = len(left.texts)
        # cap_per_line = W_L * CAP * upem / max_adv_L = (CAP*upem/adv_L) * W_L
        # total caps = n * cap_per_line = (n*CAP*upem/adv_L) * W_L
        # H = n*cap + (n-1)*leading → W_L = (H - (n-1)*leading_left) * adv_L / (n*CAP*upem)
        kL = lambda H: (H - (n - 1) * leading_left) * adv_L / (n * CAP_RATIO * upem)
    else:  # diff_fonts
        # caps sum = W_L * CAP*upem * sum(1/adv_i)
        sum_inv_L = sum(1 / _adv(font, t) for t in left.texts)
        n = len(left.texts)
        kL = lambda H: (H - (n - 1) * leading_left) / (CAP_RATIO * upem * sum_inv_L)

    if right.mode == 'same_font':
        adv_R = max(_adv(font, t) for t in right.texts)
        m = len(right.texts)
        kR = lambda H: (H - (m - 1) * leading_right) * adv_R / (m * CAP_RATIO * upem)
    else:
        sum_inv_R = sum(1 / _adv(font, t) for t in right.texts)
        m = len(right.texts)
        kR = lambda H: (H - (m - 1) * leading_right) / (CAP_RATIO * upem * sum_inv_R)

    # Row constraint: W_L(H) + W_R(H) + (H/CAP) * adv_mid / upem + 2*gap = row_w
    # Solve numerically (linear in H once the lambdas resolve; bisect for safety).
    def total_w(H):
        W_L = kL(H)
        W_R = kR(H)
        W_M = (H / CAP_RATIO) * adv_mid / upem
        return W_L + W_R + W_M + 2 * gap

    # Bisect on H
    lo, hi = 5.0, 100.0
    for _ in range(60):
        mid = (lo + hi) / 2
        if total_w(mid) > row_w:
            hi = mid
        else:
            lo = mid
    H = (lo + hi) / 2
    W_L = kL(H)
    W_R = kR(H)
    W_M = (H / CAP_RATIO) * adv_mid / upem

    # Build cells
    x = x_offset
    if left.mode == 'same_font':
        left_cell, _ = _stack_cell_same_font(font, left, W_L, x, H, 'start')
    else:
        left_cell, _ = _stack_cell_diff_fonts(font, left, W_L, x, H, 'start')

    x_mid_center = x + W_L + gap + W_M / 2
    mid_cell = _anchor_cell(font, middle.text, W_M, x_mid_center, 'middle')
    mid_cell.lines[0]['y_offset'] = H

    x_right = x_offset + row_w
    if right.mode == 'same_font':
        right_cell, _ = _stack_cell_same_font(
            font, right, W_R, x_right - W_R, H, 'end')
        # End-anchored: x is x_right (right edge)
        for ln in right_cell.lines:
            ln['x'] = x_right
            ln['anchor'] = 'end'
    else:
        right_cell, _ = _stack_cell_diff_fonts(
            font, right, W_R, x_right - W_R, H, 'end')
        for ln in right_cell.lines:
            ln['x'] = x_right
            ln['anchor'] = 'end'

    return RowOut(cells=[left_cell, mid_cell, right_cell],
                  height=H, row_width=row_w)


# ---------- SVG emission ----------

def line_to_svg(line, y_baseline, fill='#111111', extra=''):
    """Render one line dict as <text> tag."""
    parts = [
        f'x="{line["x"]:.2f}"',
        f'y="{y_baseline:.2f}"',
        f'font-size="{line["font_size"]:.3f}"',
        f'text-anchor="{line["anchor"]}"',
    ]
    if 'textLength' in line:
        parts.append(f'textLength="{line["textLength"]:.3f}"')
        parts.append('lengthAdjust="spacing"')
    if fill:
        parts.append(f'fill="{fill}"')
    if extra:
        parts.append(extra)
    return f'<text {" ".join(parts)}>{line["text"]}</text>'


def emit_row(row: RowOut, y_top, default_fill='#111111',
             accent_fill='#FFFFFF', anchor_indices=None):
    """Render an entire row as concatenated <text> tags.

    anchor_indices: list of cell indices to render with accent_fill
                    (typically the Anchor cells)."""
    out = []
    for i, cell in enumerate(row.cells):
        fill = accent_fill if anchor_indices and i in anchor_indices else default_fill
        for line in cell.lines:
            y = y_top + line['y_offset']
            extras = ''
            if anchor_indices and i in anchor_indices:
                extras = 'class="accent"'
            out.append(line_to_svg(line, y, fill, extras))
    return '\n'.join(out)
