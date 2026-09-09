#!/usr/bin/env python3
"""
make_grade_masks.py — the second mask atlas, for the colour grade.

The first atlas (make_masks.py) says what is allowed to MOVE. This one says
what is allowed to be a different COLOUR:

    R  metal   crown, hammer head, haft, belt -> pushed toward gold
    G  flesh   a tighter figure than the motion mask, so his skin can be warmed
               without warming the sky behind him
    B  rock    the crag -> cool slate, held out of the warm firelight
    A  light   where the picture is lit, at low frequency

The A channel is the one that does the most work, and it is the least obvious.
An engraving has no colour and no continuous tone: it has ink and it has paper.
Mapping its per-pixel luminance through a colour ramp is the natural thing to
try and it fails, because the hatching averages to the middle of the range
everywhere, so almost every pixel lands on the same mid stop and the result is
the original picture under a filter.

What a colourist does instead is decide where the light is, and let that decide
hue -- warm in the light, cool in the shadow -- while the ink keeps carrying the
form. So the A channel is a heavily blurred luminance: not detail, just a low
frequency field saying "this region is the light source" and "this region is
storm". The shader mixes a warm paper/ink pair against a cold one by it. Because
the field comes from the plate's own tonal massing, the warmth lands exactly
where the engraver put his light.

Most of the colour is done globally: cool shadows, warm highlights, which is the
single most reliable way to make a monochrome plate look lit rather than tinted.
These masks are only the few local windows a colourist would pull on top of
that — which is also why they can be loose. The metal is the one that has to be
roughly right, because gold in the wrong place is obvious.

Coordinates are the original plate's 1329x1600, scaled on the way in.
"""

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

REF_W, REF_H = 1329, 1600
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
# Runs both from tools/thor/ in the repo and from a scratch dir holding a copy.
SRC = next(p for p in (os.path.join(HERE, "plate.webp"),
                       os.path.join(HERE, "../../assets/thor/plate.webp"))
           if os.path.exists(p))
OUT = os.path.join(os.path.dirname(SRC), "grade.webp")

im = Image.open(SRC)
W, H = im.size
K = W / REF_W


def blobs(shapes, blur):
    m = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(m)
    for s in shapes:
        if s[0] == "e":
            _, cx, cy, rx, ry = (s[0], *[v * K for v in s[1:]])
            d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=255)
        elif s[0] == "l":
            _, x0, y0, x1, y1, w = (s[0], *[v * K for v in s[1:]])
            d.line([x0, y0, x1, y1], fill=255, width=max(1, int(w)))
        elif s[0] == "p":
            d.polygon([(x * K, y * K) for x, y in s[1]], fill=255)
    return np.asarray(m.filter(ImageFilter.GaussianBlur(blur * K)), np.float32) / 255.0


# ── metal ─────────────────────────────────────────────────────────────────
# Tight, because gold bleeding onto the sky is the one error here that shows.
metal = blobs([
    ("p", [(452, 74), (592, 62), (600, 128), (462, 146)]),   # the hammer head
    ("l", 348, 152, 596, 126, 15),                            # the haft
    ("e", 626, 300, 76, 24),                                  # the crown band
    ("p", [(552, 300), (566, 232), (584, 296), (600, 224),
           (620, 294), (640, 222), (658, 294), (676, 230),
           (692, 300)]),                                      # its points
    ("e", 680, 792, 128, 26),                                 # the belt
], 5)

# ── flesh ─────────────────────────────────────────────────────────────────
# The motion mask's figure is deliberately generous — it exists to hold the
# smoke off him. For colour that would warm the sky at his outline, so this is
# the same shapes pulled in and barely feathered.
FIGURE = [
    ("l", 415, 145, 575, 495, 96),
    ("e", 430, 145, 50, 46),
    ("e", 655, 330, 98, 116),
    ("e", 670, 460, 80, 84),
    ("e", 705, 640, 138, 162),
    ("e", 832, 585, 78, 78),
    ("l", 800, 600, 1062, 792, 84),
    ("e", 1060, 790, 52, 52),
    ("e", 675, 930, 178, 168),
    ("e", 866, 962, 80, 96),
    ("e", 620, 1055, 132, 100),
    ("e", 566, 1128, 96, 100),
    ("l", 600, 1060, 430, 1500, 86),
    ("l", 852, 1000, 900, 1412, 96),
    ("e", 420, 1520, 66, 46),
    ("e", 915, 1420, 70, 42),
]
flesh = blobs(FIGURE, 9)

# ── rock ──────────────────────────────────────────────────────────────────
rock = blobs([
    ("p", [(0, 1600), (0, 940), (115, 862), (205, 792), (262, 712), (312, 764),
           (358, 716), (420, 772), (472, 826), (556, 906), (600, 1600)]),
], 12)
# The dark ground across the bottom is stone too.
ys = np.repeat(np.arange(H)[:, None], W, axis=1).astype(np.float32)
rock = np.clip(rock + np.clip((ys - 1240 * K) / (140.0 * K), 0, 1) * 0.85, 0, 1)

# ── light ─────────────────────────────────────────────────────────────
# A big blur is the entire technique. At sigma this large the hatching is gone
# and what is left is the massing the engraver composed: the burst of light to
# the right of his head bright, the storm above and left dark, his lit side
# brighter than his shaded side. Then the histogram is stretched, because a
# blurred engraving sits in a narrow band around mid grey and an unstretched
# field would mix the two palettes at a nearly constant ratio -- which is
# another way of arriving at a flat tint.
blur = Image.open(SRC).convert("L").filter(ImageFilter.GaussianBlur(70 * K))
light = np.asarray(blur, np.float32) / 255.0
lo, hi = np.percentile(light, 4), np.percentile(light, 97)
light = np.clip((light - lo) / max(1e-6, hi - lo), 0, 1)
light = light * light * (3 - 2 * light)

rgba = np.zeros((H, W, 4), np.uint8)
rgba[..., 0] = (metal * 255).astype(np.uint8)
rgba[..., 1] = (flesh * 255).astype(np.uint8)
rgba[..., 2] = (rock * 255).astype(np.uint8)
rgba[..., 3] = (light * 255).astype(np.uint8)
Image.fromarray(rgba, "RGBA").save(OUT, lossless=True, method=6)

print(f"{OUT}  {W}x{H}")
for n, c in (("metal", metal), ("flesh", flesh), ("rock", rock)):
    print(f"  {n:<6} {(c > 0.15).mean():5.1%} of frame, peak {c.max():.2f}")
print(f"  light  mean {light.mean():.2f}, "
      f"{(light < 0.25).mean():.0%} in shadow, {(light > 0.75).mean():.0%} in light")

base = Image.open(SRC).convert("RGB").point(lambda v: 50 + v * 0.4)
t = np.asarray(base, np.float32)
t[..., 0] = np.clip(t[..., 0] + metal * 190, 0, 255)
t[..., 1] = np.clip(t[..., 1] + flesh * 110, 0, 255)
t[..., 2] = np.clip(t[..., 2] + rock * 150, 0, 255)
Image.fromarray(t.astype(np.uint8)).resize((W // 2, H // 2)).save("/tmp/shots/grade_preview.png")
Image.fromarray((light * 255).astype(np.uint8)).resize((W // 2, H // 2)) \
     .save("/tmp/shots/light_preview.png")
print("  preview -> /tmp/shots/grade_preview.png, /tmp/shots/light_preview.png")
