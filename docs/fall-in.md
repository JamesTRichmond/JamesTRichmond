# Fall In — Jamestellation

This is a new static-site implementation of the user's original constellation →
laughing face → mouth → inner sky → return concept. The original complete source
was not present in this repository; it is not presented as a modification of that
missing file.

## Integration

Load `assets/css/fall-in.css`, import `mountFallIn` from `assets/js/fall-in.js`,
and call it with the `[data-fall-in]` section. The expected children are:

- `.fall-in__scene` containing `canvas[data-fall-canvas][aria-hidden="true"]`
  and an optional `.fall-in__label`.
- `.fall-in__controls` containing native `button[data-fall-start]`,
  `button[data-fall-pause]`, and `button[data-fall-reset]`.
- `.fall-in__status[data-fall-status][aria-live="polite"]`.

The returned API has `start`, `reset`, `pause`, `resume`, and `destroy` methods.
A repeated mount disposes the previous one. No document-wide keyboard handler is
installed; native buttons provide touch, Enter, and Space interaction.

## Behavior

The initial scene is still and fully formed so the face can be recognized
without requiring an introductory animation. Travel starts only when requested:
2.2 seconds briefly scattering and gathering, 1.8 seconds approaching the mouth, 2.8 seconds inside the
star field, and 2.4 seconds returning. Each completed journey resets to the same
seeded geometry. It never mutates or consumes the 800 background stars.

The canvas is capped at device pixel ratio 2. A running journey suspends while
paused, offscreen, or in a hidden tab. Resumption does not count hidden time.
Reduced-motion mode replaces travel with still face/star-field choices; a live
preference change resets into that still mode. Idle and completed scenes schedule
no animation frames. Resize redraws a single still frame.

If Canvas is unavailable, controls remain hidden and the visible description
explains the unavailable enhancement. Without JavaScript the scene is a gradient,
so the integrating page must include an honest text description; no portfolio
content or navigation should depend on the canvas.

## Validation

`node --test tests/fall-in.test.mjs` passes 14 tests covering stage boundaries,
projection of the mouth target, timing across frame cadences, repeatable seeded
geometry, pause/visibility/intersection handling, reduced-motion changes,
completion/replay, remount cleanup, and unsupported Canvas. `node --check
assets/js/fall-in.js` and `git diff --check` also pass. These tests use a minimal
DOM/Canvas harness; browser appearance and actual keyboard/screen-reader behavior
still require integration QA.
