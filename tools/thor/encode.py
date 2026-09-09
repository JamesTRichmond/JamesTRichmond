#!/usr/bin/env python3
"""
encode.py — turn a directory of rendered frames into the README's animation.

    node render_frames.mjs 800 16 /tmp/fr     # CROP=bust LOOP=8 CYCLES=2
    python3 encode.py /tmp/fr

Animated WebP, not GIF, and the reason is the colour grade. A GIF has a 256
entry palette for the whole animation; a graded storm sky is a long smooth
gradient, so the encoder has to dither it, and dithering a gradient that is
already being warped by the smoke means a large area of the frame changes at
maximum entropy on every frame. The same eight seconds encoded both ways:

    GIF   440px  16fps  ffmpeg two-pass palette + gifsicle -O3 --lossy=90   3.6 MB
    WebP  400px  16fps  quality 50, method 5, minimize_size                 746 KB

That is not a small difference in efficiency, it is a different order of
magnitude, and it is entirely the palette. GitHub renders animated WebP in a
README, so there is no reason to pay it.

minimize_size is worth the flag by itself: it lets the encoder spend real effort
choosing how each frame is expressed against the one before it, which on an
animation this static outside the plume and the bolts is most of the file. It
was a third of the size for free.

400px for an image the README displays at 320. Beyond about 1.25x oversampling
nothing more is visible at that size, and everything above it is paid for on
every page load.
"""

import glob
import os
import sys

from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else "/tmp/fr"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   "../../assets/thor/thor.webp")
SIZE, FPS, QUALITY = 400, 16, 50

frames = sorted(glob.glob(os.path.join(SRC, "f*.png")))
if not frames:
    sys.exit(f"no frames in {SRC}")

ims = [Image.open(f).convert("RGB").resize((SIZE, SIZE), Image.LANCZOS)
       for f in frames]
ims[0].save(OUT, save_all=True, append_images=ims[1:],
            duration=round(1000 / FPS), loop=0,
            lossless=False, quality=QUALITY, method=5, minimize_size=True)

kb = os.path.getsize(OUT) / 1024
print(f"{OUT}  {len(ims)} frames  {SIZE}px  {FPS}fps  {kb:.0f} KB")
if kb > 900:
    print("  ! over budget for a README image — drop SIZE or QUALITY")
