#!/usr/bin/env python3
"""
make_masks.py — build the mask atlas the animation samples.

Four masks packed into one RGBA PNG, because a shader can read four channels
in a single texture fetch:

    R  smoke      how much the sky is allowed to be pushed around
    G  beard+hair displacement amplitude, ramped along the length
    B  drape      displacement amplitude, ramped along the length
    A  figure     the silhouette, used to keep the smoke off him

The ramp is the whole trick, and it is baked into the channel value rather
than computed in the shader: the beard channel is zero where the beard meets
his jaw and rises to full at the tip, and the drape channel is zero at his
belt and rises to full at the hem. Without it the beard detaches from his face
and reads as a sticker vibrating on top of the picture.

Nothing here needs to be pixel-accurate. Every region is feathered, so the
displacement falls smoothly to zero before it reaches an edge, and a boundary
that is off by twenty pixels costs nothing. That is why this is authored by
hand from a coordinate grid instead of segmented — segmenting an engraving is
a fight, and a soft ellipse in the right place wins it outright.

Coordinates are in the source image's own pixels (1329 x 1600).
"""

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# Every coordinate below was measured off the original plate at 1329x1600.
# The shipped plate is smaller (it compresses better and the screen throws the
# extra detail away), so the whole coordinate system is scaled on the way in
# rather than every number being rewritten.
REF_W, REF_H = 1329, 1600

SRC = "../../assets/thor/plate.webp"
OUT = "../../assets/thor/masks.webp"

im = Image.open(SRC)
SW, SH = im.size
K = SW / REF_W
W, H = SW, SH


def blank():
    return Image.new("L", (W, H), 0)


def blobs(shapes, blur):
    """Union of ellipses and thick lines, then feathered. Coordinates are in
    the 1329x1600 reference space and are scaled here."""
    m = blank()
    d = ImageDraw.Draw(m)
    for s in shapes:
        if s[0] == "e":
            _, cx, cy, rx, ry = (s[0], *[v * K for v in s[1:]])
            d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=255)
        elif s[0] == "l":
            _, x0, y0, x1, y1, w = (s[0], *[v * K for v in s[1:]])
            d.line([x0, y0, x1, y1], fill=255, width=int(w))
            r = w / 2
            d.ellipse([x0 - r, y0 - r, x0 + r, y0 + r], fill=255)
            d.ellipse([x1 - r, y1 - r, x1 + r, y1 + r], fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur * K))


def ramp(y0, y1):
    """Vertical 0..1 gradient: 0 at y0 (the anchored end), 1 at y1 (the free end)."""
    y0, y1 = y0 * K, y1 * K
    ys = np.clip((np.arange(H) - y0) / float(y1 - y0), 0, 1)
    # smoothstep, so the transition into "no movement at all" has no visible knee
    ys = ys * ys * (3 - 2 * ys)
    return np.repeat(ys[:, None], W, axis=1)


# ── the figure ────────────────────────────────────────────────────────────
# A union of simple shapes rather than one traced outline. It only has to be
# close: it is used to hold the smoke off him, and it is feathered heavily.
FIGURE = [
    ("l", 415, 145, 575, 495, 125),      # the raised arm
    ("e", 430, 145, 68, 62),             # the fist on the haft
    ("e", 655, 330, 122, 142),           # head and crown
    ("e", 670, 460, 100, 105),           # beard
    ("e", 505, 545, 84, 84),             # the trailing lock of hair
    ("e", 705, 640, 168, 195),           # torso
    ("e", 832, 585, 100, 100),           # far deltoid — a gap the warp found
    ("l", 800, 600, 1062, 792, 108),     # the extended arm
    ("e", 1060, 790, 68, 68),            # the far fist
    ("e", 675, 930, 218, 205),           # hips and the top of the drape
    ("e", 866, 962, 100, 120),           # hip into the far thigh — another gap
    ("e", 620, 1055, 165, 125),          # the hanging fold
    ("e", 566, 1128, 118, 122),          # near thigh below the hem
    ("l", 600, 1060, 430, 1500, 108),    # near leg
    ("l", 852, 1000, 900, 1412, 118),    # far leg
    ("e", 420, 1520, 84, 58),            # near foot
    ("e", 915, 1420, 88, 52),            # far foot
]
figure = blobs(FIGURE, 26)

# ── smoke ─────────────────────────────────────────────────────────────────
# Everything that is sky, held off the figure and faded out at the frame
# edges. Fading at the border matters: a warp that reaches the edge of the
# image drags the border pixels and you get a visible crawling frame.
sky = np.ones((H, W), np.float32)
fig = np.asarray(figure, np.float32) / 255.0
sky *= 1.0 - np.clip(fig * 1.9, 0, 1)

xs = np.repeat(np.arange(W)[None, :], H, axis=0).astype(np.float32)
ys = np.repeat(np.arange(H)[:, None], W, axis=1).astype(np.float32)

# hold it inside a margin
edge = 90.0 * K
m_edge = np.clip(xs / edge, 0, 1) * np.clip((W - xs) / edge, 0, 1) \
    * np.clip(ys / edge, 0, 1) * np.clip((H - ys) / edge, 0, 1)
sky *= m_edge

# The rock is not smoke. Traced as a polygon rather than a sloped line,
# because a line left the crag's peak inside the mask and stone does not
# billow.
rock_poly = [(x * K, y * K) for x, y in
             [(0, 1600), (0, 940), (115, 862), (205, 792), (262, 712), (312, 764),
              (358, 716), (420, 772), (472, 826), (556, 906), (580, 1600)]]
rm = Image.new("L", (W, H), 0)
ImageDraw.Draw(rm).polygon(rock_poly, fill=255)
rock = np.asarray(rm.filter(ImageFilter.GaussianBlur(28 * K)), np.float32) / 255.0
sky *= 1.0 - rock

# The dark ground along the bottom is not smoke either.
sky *= 1.0 - np.clip((ys - 1150 * K) / (200.0 * K), 0, 1)

# A plume, not a moving sky. Concentrated above the crag and falling away
# sharply, with only a whisper left elsewhere.
#
# This is a picture decision and a file-size decision at once. A warp that
# touches the whole sky resamples every hatch line in it on every frame, which
# is maximum entropy — a GIF of that is eight megabytes and no format saves
# you. Confining the motion to the plume cuts the moving area to about a
# seventh, and what is left holds still and costs nothing to encode. It also
# happens to be what a volcano actually looks like.
vent = np.exp(-(((xs - 300 * K) ** 2) / (2 * (255.0 * K) ** 2) + ((ys - 660 * K) ** 2) / (2 * (250.0 * K) ** 2)))
plume = np.exp(-(((xs - 250 * K) ** 2) / (2 * (330.0 * K) ** 2) + ((ys - 380 * K) ** 2) / (2 * (300.0 * K) ** 2)))
sky *= np.clip(0.04 + 1.05 * vent + 0.55 * plume, 0, 1)

# Ease off over the burst of light on the right. The rays drawn there are
# straight, and a warp turns straight lines wavy, which reads as a mistake
# rather than as heat.
sky *= 1.0 - 0.72 * np.clip((xs - 900 * K) / (280.0 * K), 0, 1)
smoke = np.clip(sky, 0, 1)

# ── beard and hair ────────────────────────────────────────────────────────
beard = np.asarray(blobs([
    ("e", 664, 448, 86, 88),             # the beard mass
    ("e", 686, 496, 54, 40),             # its lower point
], 24), np.float32) / 255.0
beard *= ramp(384, 512)                  # anchored at the jaw
# Hard stop below the beard's tip. The feather alone let it creep onto his
# chest, and a chest that ripples is worse than a beard that does not.
beard *= 1.0 - np.clip((ys - 528 * K) / (40.0 * K), 0, 1)

hair = np.asarray(blobs([
    ("e", 508, 548, 74, 72),
    ("e", 545, 505, 55, 55),
], 26), np.float32) / 255.0
hair *= ramp(478, 600)                   # anchored where it leaves his head

beard = np.clip(beard + hair, 0, 1)

# ── the drape ─────────────────────────────────────────────────────────────
cloth = np.asarray(blobs([
    ("e", 672, 880, 195, 115),           # around the waist
    ("e", 628, 1000, 168, 120),          # the big fold on his right
    ("e", 600, 1085, 128, 78),           # its hem
    ("e", 792, 950, 100, 130),           # the panel over his far thigh
    ("e", 762, 1035, 78, 72),
], 34), np.float32) / 255.0
cloth *= ramp(800, 1135)                 # anchored at the belt

# ── pack ──────────────────────────────────────────────────────────────────
rgba = np.zeros((H, W, 4), np.uint8)
rgba[..., 0] = (smoke * 255).astype(np.uint8)
rgba[..., 1] = (beard * 255).astype(np.uint8)
rgba[..., 2] = (cloth * 255).astype(np.uint8)
rgba[..., 3] = np.asarray(figure, np.uint8)
Image.fromarray(rgba, "RGBA").save(OUT, lossless=True, method=6)

print(f"{OUT}  {W}x{H}")
for name, ch in (("smoke", smoke), ("beard+hair", beard), ("drape", cloth)):
    print(f"  {name:<11} covers {(ch > 0.08).mean():5.1%} of frame, peak {ch.max():.2f}")

# A quick visual: each mask tinted over the artwork, so a misplaced region is
# obvious at a glance rather than after a render.
base = Image.open(SRC).convert("RGB").point(lambda v: 60 + v * 0.45)
prev = Image.new("RGB", (W, H))
prev.paste(base)
tint = np.asarray(prev, np.float32)
tint[..., 0] = np.clip(tint[..., 0] + smoke * 150, 0, 255)   # smoke  -> red
tint[..., 1] = np.clip(tint[..., 1] + beard * 190, 0, 255)   # beard  -> green
tint[..., 2] = np.clip(tint[..., 2] + cloth * 190, 0, 255)   # drape  -> blue
Image.fromarray(tint.astype(np.uint8)).resize((W // 2, H // 2)).save("masks_preview.png")
print("  wrote masks_preview.png")
