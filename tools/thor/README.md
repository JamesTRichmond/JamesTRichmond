# Animating the plate

The profile picture is a 19th-century wood engraving of Thor. Everything that
moves on it is the engraving's own pixels being pushed around — nothing is
redrawn and nothing is generated. That constraint is the whole design: an
image-to-video model would re-render the hatching into soup, and the hatching
is the picture.

## What moves, and the one thing that makes each read

- **Smoke.** A domain-warped flow field over the clouds already drawn there.
  The field varies across the frame — fast and vertical at the vent above the
  crag, slower and lateral higher up. A *uniform* warp is what gives you the
  "underwater jelly" look that reads as fake instantly.
- **Beard and drape.** A wave that travels outward from the anchored end, with
  amplitude ramped along the length so there is exactly zero movement where the
  beard meets his jaw and where the cloth meets his belt. Without that ramp the
  beard detaches from his face and reads as a sticker vibrating. They share one
  wind field so they gust together; the cloth is slower and lags, because cloth
  is heavier than hair.
- **The hammer.** A charge, not a flash: long rise, short peak, quick decay, a
  beat of rest. Arcs come from midpoint displacement and are thrown away every
  cycle. They grow with the charge — stubs on the hammer head at a tenth charge,
  an arch standing over his crown with its feet either side of his head at full,
  which is the whole gesture. The light spills onto his fist and forearm, and
  the figure mask occludes the sharp filament but deliberately not the glow, so
  bolts pass behind him while their light still lands on him. Light that touches
  nothing around it reads as pasted on; a filament across his forehead stops
  being weather and becomes a mistake in the drawing.
- **Colour.** Ink and paper, not a colour ramp. See below — it is the part that
  is least obvious and most load-bearing.

## The colour grade

An engraving has no colour and no continuous tone. It has ink, and it has paper.
Running its luminance through a colour ramp is the obvious approach and it does
not work: the hatching averages into the middle of the range almost everywhere,
so nearly every pixel lands on the same mid stop and the result is the original
picture under a filter.

So the shader does what a colourist does instead. `make_grade_masks.py` bakes a
heavily blurred luminance of the plate into the A channel of a second atlas —
not detail, just a low-frequency field saying *this region is the light source,
this region is storm*. Because it comes from the plate's own tonal massing it
lands the warmth exactly where the engraver put his light. Every material is
then described by two colours, its paper under the light and its ink under the
same light, and each pixel is a mix of that pair by local ink density. Hue comes
from an authored decision rather than a number the plate happens to contain,
which is the difference between a graded picture and a tinted one.

The single most consequential number in it is how narrow that light window is.
Wide, and most of the frame sits in the warm half — a bright hazy picture with
nowhere for the discharge to be the brightest thing. It also destroys the colour
of the lightning, because a bolt drawn over cream clips all three channels and
comes out white.

## Two bugs worth writing down

**The halo was a slab, and the drawing was innocent.** A 2D canvas stores colour
premultiplied by its own alpha, and `texImage2D` of a canvas un-premultiplies it
on the way into a texture. A glow drawn at 20% alpha is stored as 0.2 x 0.2 and
divided back by 0.2 — so every pixel the glow touched at all came back
saturated, and the falloff was destroyed *after* the blur. No amount of blurring
or curve-fitting could have fixed it. `getContext("2d", { alpha: false })` fixes
it in one line, because an opaque canvas has alpha 1 and nothing is divided.

**The loop was not seamless, and the test that said it was, was lying.** The
test compared `drawAt(0)` against `drawAt(LOOP)` — and `drawAt` does `t % loop`,
so it was comparing a frame with itself. Measured honestly (the last frame
against the first) the wrap was jumping about 3.6x as far as a normal frame
step. Two separate causes: the noise lattice has to tile in a *whole number of
cells* and its period has to scale with each octave, and every oscillator has to
complete a whole number of cycles per loop — the beard's rate worked out to 4.58
cycles, and the leftover 0.58 was a flick every time it restarted. Both fixed;
the wrap now measures smaller than a normal frame step.

## Rebuilding

```
python3 make_masks.py                                  # -> assets/thor/masks.webp
python3 make_grade_masks.py                            # -> assets/thor/grade.webp
CROP=bust LOOP=8 CYCLES=2 \
  node render_frames.mjs 800 16 /tmp/fr                # headless browser
python3 encode.py /tmp/fr                              # -> assets/thor/thor.webp
```

`make_masks.py` writes four masks into one RGBA image (R smoke, G beard+hair,
B drape, A figure) with the amplitude ramps baked into the channel values. Its
coordinates are all measured against the original plate at 1329x1600 and scaled
to whatever the shipped plate actually is, so the plate can be re-compressed
without touching a single number in here.

Nothing needs to be pixel-accurate: every region is feathered, so displacement
falls to zero before it reaches an edge and a boundary off by twenty pixels
costs nothing. That is why these are hand-placed ellipses rather than a
segmentation — segmenting an engraving is a fight, and a soft ellipse in the
right place wins it.

## Why it is a WebP, and only 400px

Fine hatching plus continuous sub-pixel motion is close to maximum entropy: no
frame-based format compresses it. The full-sky version of this was **8 MB** as a
GIF, 17 MB as APNG. Confining the warp to the plume — which is what a volcano
looks like anyway — cut the moving area to a seventh, and that is what made it
shippable at all.

Colour then ruled out GIF entirely. A GIF has one 256-entry palette for the
whole animation, and a graded storm sky is a long smooth gradient, so the
encoder must dither it — and dithering a gradient that the smoke is already
warping means a large area changing at maximum entropy every frame. The same
eight seconds, both ways:

| | | |
|---|---|---|
| GIF  | 440px, ffmpeg two-pass palette + `gifsicle -O3 --lossy=90` | 3.6 MB |
| WebP | 400px, quality 50, `method=5`, `minimize_size` | 746 KB |

That is not an efficiency difference, it is an order of magnitude, and it is
entirely the palette. GitHub renders animated WebP in a README, so there is no
reason to pay it. `minimize_size` alone was worth a third of the file: it lets
the encoder spend real effort expressing each frame against the previous one,
which on an animation this static outside the plume and the bolts is most of the
bytes.

400px for something the README shows at 320. Past about 1.25x oversampling
nothing more is visible at that size, and everything above it is paid for on
every page load. The site runs the shader live and has no such problem.

## Provenance

The plate is a 19th-century wood engraving. Britannica's Thor page credits its
*main* image to Mårten Winge's 1872 painting, which is a different picture —
this engraving is uncredited there and I could not identify the artist, so the
site's caption claims only the century. Worth pinning down before claiming more.
