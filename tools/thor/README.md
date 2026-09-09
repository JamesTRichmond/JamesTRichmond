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
  cycle. The light also spills onto his fist and forearm — light that touches
  nothing around it reads as pasted on.

## Rebuilding

```
python3 make_masks.py                 # -> assets/thor/masks.webp
node render_frames.mjs 800 10 /tmp/f  # frames, via a headless browser
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

## Why the GIF is only 320px

Fine hatching plus continuous sub-pixel motion is close to maximum entropy: no
frame-based format compresses it. The full-sky version of this was **8 MB** as
a GIF, 17 MB as APNG. Confining the warp to the plume — which is what a volcano
looks like anyway — cut the moving area to a seventh, and a tight crop, a 4 s
loop and lossy palette quantisation got it to about 500 KB. The site runs the
shader instead and has no such problem.

## Provenance

The plate is a 19th-century wood engraving. Britannica's Thor page credits its
*main* image to Mårten Winge's 1872 painting, which is a different picture —
this engraving is uncredited there and I could not identify the artist, so the
site's caption claims only the century. Worth pinning down before claiming more.
