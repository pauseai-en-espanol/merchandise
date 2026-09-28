#!/usr/bin/env python3
"""
Draw the shoggoth-cara-amable creature from scratch and splice it, as pure
vector art, into designs/shoggoth-cara-amable/{es,en}.orange.front.svg.

An ORIGINAL bold, linocut / flash-tattoo style re-drawing of the "shoggoth
with a smiley face" meme, composed after Anna Husfeldt's CC BY-SA 3.0
illustration (eye-studded tentacled mass with a toothed maw, a pink human
mask on a tentacle, a yellow smiley on a stalk poking out of the mask's
mouth). Nothing is traced: every shape is generated here from splines,
blobs and circles, so the look is tuned for screen-print / DTG on a tee —
one solid silhouette, detail CARVED OUT of it (the tee shows through), and a
handful of flat spot fills.

How it works
------------
1. The creature is painted, in painter's order, into a label raster
   (PX px/mm over the 200 × 200 mm canvas). Each label is a print colour:

       0 KNOCK   nothing printed — the tee shows through (carved lines,
                 gaps between overlapping tentacles, rings around eyes)
       1 BODY    the silhouette — deep green on every tee (bodyGreen)
       2 WHITE   sclerae, teeth, glints          (constant)
       3 PINK    the mask                        (constant, illustrationColors)
       4 YELLOW  the smiley                      (constant, illustrationColors)
       5 IRIS    eye irises — PauseAI orange     (constant)
       6 INKFIX  pupils, maw interior, mask & smiley features — INK on
                 every tee (tagged class="keep" so the per-tee builder
                 never flips it to paper on the black tee)

2. Each colour is vectorised with potrace (lower layers get a small
   underlay beneath the colours stacked on them, so there are no hairline
   seams between separations).

3. The result replaces the <g id="art"> block of both canonical fronts.
   Text (headline, labels, credit) is hand-authored in those SVGs and is
   not touched.

Everything is deterministic (fixed RNG seed). One-off / art-regeneration
tool, NOT a pipeline stage — run it only when changing the drawing, then
run scripts/build-all.sh.

Requirements (not pipeline deps):
    brew install potrace
    pip install pillow numpy scipy          # in a venv

    python3 scripts/draw-shoggoth.py                 # splice into canon
    python3 scripts/draw-shoggoth.py --preview out.png  # raster preview only
"""
import argparse
import json
import math
import re
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
DESIGN = ROOT / 'designs/shoggoth-cara-amable'

PX = 20                     # raster px per mm
W = H = 200                 # canvas, mm

KNOCK, BODY, WHITE, PINK, YELLOW, IRIS, INKFIX = range(7)

_TOK = json.loads((ROOT / 'brand/tokens.json').read_text())
INK = _TOK['colors']['ink']['hex']
PAPER = _TOK['colors']['paper']['hex']
ORANGE = _TOK['colors']['orange']['hex']
MASK_PINK = _TOK['illustrationColors']['maskPink']['hex']
SMILEY_YELLOW = _TOK['illustrationColors']['smileyYellow']['hex']
BODY_GREEN = _TOK['illustrationColors']['bodyGreen']['hex']

# The creature is drawn in its own mm frame, then placed on the 200 × 200
# canvas by this uniform scale + offset (applied to the traced vectors).
ART_SCALE = 0.92
ART_DX, ART_DY = 6.0, 10.8

# Carve widths (mm, drawing frame). Every carved line tapers no thinner than
# THIN, which lands at ≥ 0.4 mm on the canvas (hairline rule for print).
GAP = 0.8                   # outline gap around overlapping parts
CARVE = 0.58                # veins / hatching / tentacle grooves
THIN = 0.44
assert THIN * ART_SCALE >= 0.4

rng = np.random.default_rng(7)


# --- raster canvas -----------------------------------------------------

img = Image.new('L', (W * PX, H * PX), KNOCK)
draw = ImageDraw.Draw(img)


def _p(pt):
    return (pt[0] * PX, pt[1] * PX)


def disc(c, r, label):
    x, y = c
    draw.ellipse([(x - r) * PX, (y - r) * PX, (x + r) * PX, (y + r) * PX],
                 fill=label)


def poly(pts, label):
    draw.polygon([_p(p) for p in pts], fill=label)


def spline(ctrl, n=48, closed=False):
    """Uniform Catmull-Rom through ctrl points → dense (N, 2) polyline."""
    P = np.asarray(ctrl, float)
    if closed:
        P = np.vstack([P[-1], P, P[0], P[1]])
    else:
        P = np.vstack([2 * P[0] - P[1], P, 2 * P[-1] - P[-2]])
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for t in np.linspace(0, 1, n, endpoint=False):
            t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t
                              + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
                              + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    if not closed:
        out.append(P[-2])
    return np.array(out)


def normals(pts):
    d = np.gradient(pts, axis=0)
    d /= np.linalg.norm(d, axis=1, keepdims=True) + 1e-9
    return np.stack([-d[:, 1], d[:, 0]], axis=1)


def ribbon(pts, widths, label):
    """Stroke a polyline with per-point width (round joins + caps)."""
    widths = np.broadcast_to(np.asarray(widths, float), (len(pts),))
    nrm = normals(pts)
    L = pts + nrm * widths[:, None] / 2
    R = pts - nrm * widths[:, None] / 2
    for i in range(len(pts) - 1):
        poly([L[i], L[i + 1], R[i + 1], R[i]], label)
    for i in range(0, len(pts), 3):
        disc(pts[i], widths[i] / 2, label)
    disc(pts[-1], widths[-1] / 2, label)


def taper(n, w0, w1, power=1.0):
    t = np.linspace(0, 1, n) ** power
    return w0 + (w1 - w0) * t


def blob(c, rx, ry, lumps, rot=0.0, k=18):
    """Closed lumpy outline: ellipse + sum of sinusoidal lumps."""
    th = np.linspace(0, 2 * np.pi, k, endpoint=False)
    r = np.ones_like(th)
    for amp, freq, phase in lumps:
        r += amp * np.sin(freq * th + phase)
    x, y = rx * r * np.cos(th), ry * r * np.sin(th)
    cr, sr = math.cos(rot), math.sin(rot)
    ctrl = np.stack([c[0] + cr * x - sr * y, c[1] + sr * x + cr * y], 1)
    return spline(ctrl, n=16, closed=True)


def fill_outline(outline, label, gap=GAP):
    if gap:
        ribbon(np.vstack([outline, outline[:1]]), 2 * gap, KNOCK)
    poly(outline, label)


# --- parts -------------------------------------------------------------

def eye(c, r, gaze=(-0.3, 0.1), ring=0.7):
    """White sclera, orange iris, ink pupil, glint; knocked-out ring."""
    disc(c, r + ring, KNOCK)
    disc(c, r, WHITE)
    gx, gy = gaze
    if r >= 1.6:
        ic = (c[0] + gx * r * 0.35, c[1] + gy * r * 0.35)
        disc(ic, r * 0.62, IRIS)
        disc(ic, r * 0.32, INKFIX)
        if r >= 2.4:
            disc((ic[0] - r * 0.14, ic[1] - r * 0.16), max(r * 0.11, 0.3),
                 WHITE)
    else:
        disc((c[0] + gx * r * 0.3, c[1] + gy * r * 0.3), r * 0.5, INKFIX)


def tentacle(ctrl, w0, w1, eyes=(), groove=True, gap=GAP, power=0.9,
             groove_side=1):
    pts = spline(ctrl)
    w = taper(len(pts), w0, w1, power)
    ribbon(pts, w + 2 * gap, KNOCK)
    ribbon(pts, w, BODY)
    if groove:
        # a carved groove running along one flank, linocut style
        nrm = normals(pts)
        a, b = int(len(pts) * 0.08), int(len(pts) * 0.72)
        g = pts[a:b] + groove_side * nrm[a:b] * (w[a:b, None] * 0.24)
        gw = np.minimum(CARVE, w[a:b] * 0.12)
        keep = gw >= THIN
        if keep.sum() > 4:
            ribbon(g[keep], gw[keep], KNOCK)
    for t, r in eyes:
        i = int(t * (len(pts) - 1))
        eye(tuple(pts[i]), r)
    return pts


def eyestalk(ctrl, w0=1.9, w1=1.2, r=2.3):
    pts = spline(ctrl)
    ribbon(pts, taper(len(pts), w0 + 1.4, w1 + 1.4), KNOCK)
    ribbon(pts, taper(len(pts), w0, w1), BODY)
    tip = tuple(pts[-1])
    disc(tip, r + 1.2, KNOCK)
    disc(tip, r + 0.55, BODY)       # little fleshy cup around the eye
    d = pts[-1] - pts[-6]
    d /= np.linalg.norm(d)
    eye(tip, r, gaze=(d[0], d[1]), ring=0.45)


def tendril(ctrl, w0=1.7, w1=0.8, gap=0.6):
    """Thin flailing whip with no eye."""
    pts = spline(ctrl)
    w = taper(len(pts), w0, w1)
    ribbon(pts, w + 2 * gap, KNOCK)
    ribbon(pts, w, BODY)


def veins(c, rx, ry, n, seed_angles=None, inset=0.18, rot=0.0):
    """Branching carved cracks growing inward from near a blob's rim."""
    cr, sr = math.cos(rot), math.sin(rot)
    angles = seed_angles if seed_angles is not None else rng.uniform(
        0, 2 * np.pi, n)
    for a in angles:
        rr = 1 - inset
        x, y = rx * rr * math.cos(a), ry * rr * math.sin(a)
        p = np.array([c[0] + cr * x - sr * y, c[1] + sr * x + cr * y])
        heading = math.atan2(c[1] - p[1], c[0] - p[0]) + rng.uniform(-.6, .6)
        _crack(p, heading, rng.uniform(7, 12), depth=0)


def _crack(p, heading, length, depth):
    pts = [p]
    steps = max(3, int(length / 1.2))
    for _ in range(steps):
        heading += rng.uniform(-0.45, 0.45)
        p = p + 1.2 * np.array([math.cos(heading), math.sin(heading)])
        pts.append(p)
    pts = spline(pts, n=6)
    ribbon(pts, taper(len(pts), CARVE * 1.3, THIN), KNOCK)
    if depth < 1:
        for _ in range(rng.integers(1, 3)):
            j = int(rng.uniform(0.35, 0.8) * (len(pts) - 1))
            _crack(pts[j], heading + rng.choice([-1, 1]) * rng.uniform(.6, 1.1),
                   length * 0.5, depth + 1)


def hatch(c, rx, ry, a0, a1, n, length=(2.2, 4.2), rot=0.0, inset=1.4):
    """Engraving-style shading: short carved ticks along part of a rim."""
    cr, sr = math.cos(rot), math.sin(rot)
    for a in np.linspace(a0, a1, n):
        x, y = math.cos(a), math.sin(a)
        e = np.array([rx * x, ry * y])
        nrm = np.array([x / rx, y / ry])
        nrm /= np.linalg.norm(nrm)
        L = rng.uniform(*length) * (0.55 + 0.45 * math.sin(
            math.pi * (a - a0) / (a1 - a0)))
        p0 = e - nrm * inset
        p1 = e - nrm * (inset + L)
        seg = np.array([p0, p1])
        seg = np.stack([c[0] + cr * seg[:, 0] - sr * seg[:, 1],
                        c[1] + sr * seg[:, 0] + cr * seg[:, 1]], 1)
        ribbon(spline(seg, n=6), taper(7, CARVE * 1.1, THIN), KNOCK)


# --- the creature ------------------------------------------------------

def bubble(c, rx, ry, rot=0.0, eyes=(), veins_at=(), shade=(0.15, 2.0),
           lumps=None, gap=GAP):
    """One protoplasmic bulb: filled lump, carved shading + cracks, eyes."""
    if lumps is None:
        lumps = [(rng.uniform(.02, .05), 3, rng.uniform(0, 6)),
                 (rng.uniform(.01, .03), 5, rng.uniform(0, 6))]
    fill_outline(blob(c, rx, ry, lumps, rot=rot), BODY, gap=gap)
    if veins_at:
        veins(c, rx, ry, 0, rot=rot, seed_angles=veins_at)
    if shade:
        hatch(c, rx, ry, shade[0], shade[1],
              max(6, int((shade[1] - shade[0]) * (rx + ry) / 2 / 1.7)),
              rot=rot)
    for (u, v), r in eyes:
        eye((c[0] + u, c[1] + v), r)


def draw_creature():
    # 1. the heaving back mass — a pile of bulbs, back to front
    bubble((174, 98), 12, 11, eyes=[((3, -2), 2.2)], veins_at=[-2.2, -0.9])
    bubble((186, 122), 9, 14, eyes=[((1, -4), 1.8), ((-1, 5), 1.4)])
    bubble((156, 108), 17, 15, eyes=[((8, -5), 2.8)],
           veins_at=[-1.6, -0.6])
    bubble((171, 128), 15, 14, rot=0.3,
           eyes=[((4, -3), 3.4), ((-5, 7), 1.6)], veins_at=[-1.2, 0.2])
    bubble((158, 146), 14, 10, eyes=[((-4, 1), 2.0), ((6, 3), 1.4)])

    # 2. tentacles behind the head
    tentacle([(176, 108), (186, 96), (190, 84), (185, 76), (179, 78),
              (180, 83)], 8, 2.0, eyes=[(0.35, 1.6)])
    tentacle([(162, 92), (166, 80), (160, 72), (152, 72)], 6, 1.8,
             groove_side=-1)
    tentacle([(182, 140), (190, 146), (189, 155), (182, 157)], 7, 2.0)

    # 3. whips and eyestalks (bases hidden under the head)
    tendril([(156, 96), (163, 82), (157, 72), (161, 64), (167, 63),
             (167, 67)])
    tendril([(122, 146), (110, 156), (98, 157), (92, 152), (96, 149)])
    tendril([(184, 116), (192, 104), (189, 97), (193, 90)], 1.6, 0.8)
    eyestalk([(134, 88), (138, 76), (143, 69), (149, 64)])
    eyestalk([(146, 96), (159, 84), (170, 72), (174, 62)], r=2.5)
    eyestalk([(160, 118), (176, 112), (186, 108), (193, 110)], r=1.8)

    # 4. the arm carrying the mask (emerges from behind the head)
    tentacle([(130, 124), (108, 133), (90, 131), (76, 124), (66, 119)],
             11, 6.5, eyes=[(0.35, 1.8), (0.62, 1.4)], power=1.2)

    # 5. the head: one big bulb with the maw on its face
    head_c, head_rx, head_ry, head_rot = (131, 104), 28, 25, -0.1
    fill_outline(blob(head_c, head_rx, head_ry,
                      [(.035, 3, 2.0), (.02, 5, .7), (.012, 7, 1.9)],
                      rot=head_rot), BODY, gap=1.1)
    veins(head_c, head_rx, head_ry, 0, rot=head_rot,
          seed_angles=[-1.95, -1.4, -0.85, -0.3, 0.3, 2.9])
    hatch(head_c, head_rx, head_ry, 0.1, 2.3, 30, rot=head_rot,
          length=(2.6, 5.2))
    for c, r in [((146, 90), 3.8), ((154, 106), 2.6), ((141, 117), 4.4),
                 ((129, 84), 2.1), ((124, 121), 1.9), ((152, 119), 1.5),
                 ((138, 97), 1.4)]:
        eye(c, r)

    # 6. the maw — a vertical, fang-lined mouth with an eye inside
    maw(center=(114, 102), rx=9.6, ry=16.5, rot=-0.18)

    # 7. front tentacles (over the head's lower edge)
    bubble((146, 136), 12, 9, rot=-0.2, eyes=[((3, -1), 2.3)],
           shade=(0.3, 2.4))
    tentacle([(124, 122), (114, 138), (100, 148), (86, 148), (79, 141),
              (83, 134), (90, 136)], 10, 2.2,
             eyes=[(0.18, 2.0), (0.42, 1.5)], groove_side=-1)
    tentacle([(150, 138), (160, 150), (174, 152), (184, 146), (183, 138),
              (176, 138)], 10, 2.2, eyes=[(0.25, 2.0), (0.55, 1.4)])
    tentacle([(136, 132), (133, 144), (126, 153), (116, 156)], 8, 2.5,
             eyes=[(0.3, 1.6)])

    # 8. the mask, the stalk, the smiley
    mask(center=(55, 117), rot=-0.14)


def maw(center, rx, ry, rot):
    cr, sr = math.cos(rot), math.sin(rot)

    def at(u, v):
        return (center[0] + cr * u - sr * v, center[1] + sr * u + cr * v)

    th = np.linspace(0, 2 * np.pi, 64, endpoint=False)
    outline = np.array([at(rx * math.cos(t) * (1 + .06 * math.sin(3 * t)),
                           ry * math.sin(t)) for t in th])
    ribbon(np.vstack([outline, outline[:1]]), 2 * 1.1, KNOCK)
    # a fleshy lip ring, then the dark gullet
    poly(outline, BODY)
    inner = np.array([at(0.8 * rx * math.cos(t), 0.86 * ry * math.sin(t))
                      for t in th])
    ribbon(np.vstack([inner, inner[:1]]), 0.9, KNOCK)
    poly(inner, INKFIX)
    # fangs: from the whole rim, pointing to the centre; longest top/bottom
    n = 26
    for k in range(n):
        t = 2 * np.pi * k / n + 0.07
        base = np.array([0.8 * rx * math.cos(t), 0.86 * ry * math.sin(t)])
        vert = abs(math.sin(t))
        L = (2.4 + 5.5 * vert ** 2) * rng.uniform(0.8, 1.15)
        half = 0.75 + 0.35 * vert
        tangent = np.array([-math.sin(t) * rx, math.cos(t) * ry])
        tangent /= np.linalg.norm(tangent)
        tip = base * (1 - L / np.linalg.norm(base))
        pts = [base + tangent * half, tip, base - tangent * half]
        poly([at(*p) for p in pts], WHITE)
    # the eye in the throat
    eye(at(0.4, 0.0), 3.3, gaze=(-0.6, 0.0), ring=0.9)


def mask(center, rot):
    cr, sr = math.cos(rot), math.sin(rot)

    def at(u, v):
        return (center[0] + cr * u - sr * v, center[1] + sr * u + cr * v)

    def line(pts_uv, w, label=INKFIX, n=10):
        pts = spline([at(*p) for p in pts_uv], n=n)
        ribbon(pts, w, label)

    face = [(-8.5, -13.5), (0, -15.5), (8.5, -13), (11.2, -5), (10.6, 4),
            (8.8, 10), (7.2, 16.5), (5.2, 12.8), (2.4, 15.2), (0.2, 19.5),
            (-2.0, 14.0), (-5.0, 13.0), (-8.6, 9.5), (-10.8, 3), (-11.3, -5)]
    outline = spline([at(*p) for p in face], n=12, closed=True)
    fill_outline(outline, PINK, gap=1.0)
    ribbon(np.vstack([outline, outline[:1]]), 0.7, INKFIX)
    # thin elastic strap wrapping back into the arm
    # (the arm already sits behind; nothing to draw)

    # droopy, worried eyes
    for s in (-1, 1):
        ex = 4.6 * s
        line([(ex - 3.0, -3.0), (ex, -4.8), (ex + 3.0, -3.0)], 1.0)  # lid
        line([(ex - 2.6, -2.6), (ex, -1.5), (ex + 2.6, -2.6)], 0.5)  # lower
        disc(at(ex - 0.4, -3.0), 0.95, INKFIX)                        # pupil
        line([(ex - 3.3 * s, -8.2), (ex, -7.5), (ex + 2.8 * s, -9.4)],
             0.85)                                                    # brow
        line([(ex - 1.8, -0.3), (ex + 1.6, -0.2)], 0.45)               # bag
    # nose
    line([(0.2, -4.2), (-0.7, 1.8), (0.3, 2.9), (1.8, 2.2)], 0.6)
    # nasolabial folds
    for s in (-1, 1):
        line([(2.8 * s, 2.5), (4.6 * s, 5.2), (4.9 * s, 8.6)], 0.5)
    # open grimace with a row of teeth — the stalk comes out of it
    mouth_c = (0.0, 8.2)
    th = np.linspace(0, 2 * np.pi, 40, endpoint=False)
    m = [at(mouth_c[0] + 3.9 * math.cos(t), mouth_c[1] + 2.9 * math.sin(t))
         for t in th]
    poly(m, INKFIX)
    teeth = [at(mouth_c[0] + u, mouth_c[1] + v) for u, v in
             [(-3.0, -1.6), (3.0, -1.6), (2.7, -0.4), (-2.7, -0.4)]]
    poly(teeth, WHITE)
    for u in (-1.5, 0.0, 1.5):
        line([(u, -2.0), (u, -0.3)], THIN)

    # the stalk out of the mouth, ending in the smiley
    start = np.array(at(mouth_c[0] - 1.5, mouth_c[1] + 0.8))
    smiley_c = np.array([28.0, 121.5])
    mid = (start + smiley_c) / 2 + np.array([0, 3.0])
    pts = spline([start, mid, smiley_c], n=24)
    ribbon(pts, taper(len(pts), 2.6, 1.8), BODY)
    smiley(tuple(smiley_c), 6.6)


def smiley(c, r):
    disc(c, r + 1.0, KNOCK)
    disc(c, r + 0.55, INKFIX)
    disc(c, r, YELLOW)
    x, y = c
    for s in (-1, 1):
        draw.ellipse([(x + 2.3 * s - 0.75) * PX, (y - 2.9) * PX,
                      (x + 2.3 * s + 0.75) * PX, (y - 0.4) * PX], fill=INKFIX)
    th = np.linspace(0.25 * np.pi, 0.75 * np.pi, 20)
    arc = np.stack([x + 4.0 * np.cos(th), y + 0.4 + 3.2 * np.sin(th)], 1)
    ribbon(arc, 0.95, INKFIX)
    for s in (-1, 1):
        ribbon(spline([(x + 3.95 * s, y + 1.8), (x + 4.5 * s, y + 1.3)], n=4),
               0.8, INKFIX)
    # "shine" rays: the RLHF sparkle
    for a in np.radians([196, 224, 252, 280, 308]):
        p0 = np.array([x + (r + 2.0) * math.cos(a), y + (r + 2.0) * math.sin(a)])
        p1 = np.array([x + (r + 4.6) * math.cos(a), y + (r + 4.6) * math.sin(a)])
        ribbon(np.array([p0, p1]), 0.8, BODY)


# --- output ------------------------------------------------------------

STACK = [BODY, PINK, YELLOW, WHITE, IRIS, INKFIX]   # bottom → top
FILLS = {BODY: BODY_GREEN, PINK: MASK_PINK, YELLOW: SMILEY_YELLOW,
         WHITE: PAPER,
         IRIS: ORANGE, INKFIX: INK}
IDS = {BODY: 'shoggoth-body', PINK: 'shoggoth-mask', YELLOW: 'shoggoth-smiley',
       WHITE: 'shoggoth-white', IRIS: 'shoggoth-iris', INKFIX: 'shoggoth-ink'}
def preview(lab, path, tee=ORANGE):
    pal = {**FILLS, KNOCK: tee}
    rgb = np.zeros(lab.shape + (3,), np.uint8)
    for k, col in pal.items():
        rgb[lab == k] = [int(col[i:i + 2], 16) for i in (1, 3, 5)]
    Image.fromarray(rgb).resize((W * 5, H * 5), Image.LANCZOS).save(path)


def trace(mask_arr):
    """potrace a boolean mask → SVG path data in raster px coordinates."""
    with tempfile.TemporaryDirectory() as td:
        pbm = Path(td) / 'm.pbm'
        out = Path(td) / 'm.svg'
        Image.fromarray(np.where(mask_arr, 0, 255).astype(np.uint8)) \
            .convert('1').save(pbm)
        subprocess.run(['potrace', str(pbm), '-s', '--flat', '-o', str(out),
                        '--turdsize', '12', '--alphamax', '1.1',
                        '--opttolerance', '0.4', '-u', '1'], check=True)
        svg = out.read_text()
    tr = re.search(r'<g transform="([^"]+)"', svg).group(1)
    ds = re.findall(r'<path d="([^"]+)"', svg)
    return tr, ' '.join(d.replace('\n', ' ') for d in ds)


def build_art(lab):
    lines = [f'  <g id="art" transform="translate({ART_DX:g} {ART_DY:g}) '
             f'scale({ART_SCALE / PX:.6g})">']
    for i, k in enumerate(STACK):
        own = lab == k
        if not own.any():
            continue
        above = np.isin(lab, STACK[i + 1:])
        # underlay: extend a few px beneath the colours stacked on top
        m = own | (ndimage.binary_dilation(own, iterations=3) & above)
        tr, d = trace(m)
        keep = ' class="keep"' if k == INKFIX else ''
        lines.append(f'    <g id="{IDS[k]}"{keep} fill="{FILLS[k]}" '
                     f'stroke="none" transform="{tr}"><path d="{d}"/></g>')
    lines.append('  </g>')
    return '\n'.join(lines)


def splice(svg, art):
    start = svg.rindex('\n', 0, svg.index('<g id="art"')) + 1
    end = svg.index('<g id="phrase"')
    end = svg.rindex('\n', 0, end) + 1
    return svg[:start] + art + '\n\n' + svg[end:]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--preview', help='write raster previews with this '
                    'path prefix and exit (…orange.png / …white.png / '
                    '…black.png)')
    args = ap.parse_args()

    draw_creature()
    lab = np.array(img)

    if args.preview:
        pre = args.preview
        preview(lab, f'{pre}.orange.png')
        preview(lab, f'{pre}.white.png', tee=PAPER)
        preview(lab, f'{pre}.black.png', tee='#141414')
        return

    art = build_art(lab)
    for lang in ('es', 'en'):
        p = DESIGN / f'{lang}.orange.front.svg'
        p.write_text(splice(p.read_text(), art))
        print(f'  wrote {p.relative_to(ROOT)}  ({p.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
