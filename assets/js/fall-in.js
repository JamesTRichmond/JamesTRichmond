/* Fall In — Jamestellation.
 * A new implementation of the original orbit → face → mouth → stars journey.
 * Geometry and time are deterministic; the canvas never owns page navigation.
 */

export const DURATIONS = Object.freeze({ form: 2.2, flyin: 1.8, inside: 2.8, return: 2.4 });
export const JOURNEY_SECONDS = Object.values(DURATIONS).reduce((sum, value) => sum + value, 0);
export const MOUTH = Object.freeze({ x: 0.012, y: 0.185 });
const TAU = Math.PI * 2;
const SEED = 0x4a414d45;
const IDLE_FACE = 1;
const mounts = new WeakMap();

export function clamp(value, low = 0, high = 1) {
  return Math.min(high, Math.max(low, value));
}

export function ease(value) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

export function seededRandom(seed = SEED) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let n = value;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable records, never moved or depleted by a visit through the stars. */
export function createStars(count = 800, seed = SEED) {
  const random = seededRandom(seed);
  return Array.from({ length: Math.max(0, Math.min(1600, Math.floor(count))) }, () => ({
    x: random() * 2 - 1,
    y: random() * 2 - 1,
    z: 0.12 + random() * 0.88,
    light: 0.22 + random() * 0.78,
    size: 0.35 + random() * 1.1,
    phase: random() * TAU,
  }));
}

/** No integration of particle positions: sampling a time always gives one scene. */
export function sampleJourney(elapsed = null) {
  const idle = { phase: 'orbit', progress: 0, face: IDLE_FACE, zoom: 1, cameraX: 0,
    cameraY: 0, warp: 0, flight: 0, faceOpacity: 1, done: false };
  if (elapsed === null || !Number.isFinite(elapsed) || elapsed < 0) return idle;
  if (elapsed >= JOURNEY_SECONDS) return { ...idle, done: true };
  let t = elapsed;
  if (t < DURATIONS.form) {
    const progress = t / DURATIONS.form;
    // The resting face stays legible. Only an explicit request scatters its
    // points briefly, then gathers them before the flight through the mouth.
    const face = progress < 0.16 ? 1 - 0.64 * ease(progress / 0.16)
      : 0.36 + 0.64 * ease((progress - 0.16) / 0.84);
    return { ...idle, phase: 'form', progress, face };
  }
  t -= DURATIONS.form;
  if (elapsed < DURATIONS.form + DURATIONS.flyin) {
    const progress = t / DURATIONS.flyin;
    const p = ease(progress);
    return { ...idle, phase: 'flyin', progress, face: 1,
      zoom: Math.exp(Math.log(0.08) * p), cameraX: MOUTH.x * p,
      cameraY: MOUTH.y * p, warp: p, flight: t * p,
      faceOpacity: 1 - ease((progress - 0.64) / 0.36) };
  }
  t -= DURATIONS.flyin;
  if (elapsed < DURATIONS.form + DURATIONS.flyin + DURATIONS.inside) {
    return { ...idle, phase: 'inside', progress: clamp(t / DURATIONS.inside), face: 1,
      zoom: 0.08, cameraX: MOUTH.x, cameraY: MOUTH.y,
      warp: 1, flight: DURATIONS.flyin + t, faceOpacity: 0 };
  }
  t -= DURATIONS.inside;
  const progress = clamp(t / DURATIONS.return);
  const p = ease(progress);
  return { ...idle, phase: 'return', progress, face: IDLE_FACE,
    zoom: Math.exp(Math.log(0.08) * (1 - p)), cameraX: MOUTH.x * (1 - p),
    cameraY: MOUTH.y * (1 - p), warp: 1 - p,
    flight: DURATIONS.flyin + DURATIONS.inside + t,
    faceOpacity: ease(progress / 0.55) };
}

/** Pure clock step; visibility and pause gates are controlled by the mount. */
export function advanceJourney(elapsed, deltaSeconds, active = true) {
  if (elapsed === null || !active || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return elapsed;
  const next = elapsed + deltaSeconds;
  return next >= JOURNEY_SECONDS ? null : next;
}

/** The camera's target and mouth glow use this same projection. */
export function projectPoint(point, scene, width, height) {
  const unit = Math.min(width, height) * 0.85;
  return {
    x: width * 0.5 + (point.x - scene.cameraX) * unit / scene.zoom,
    y: height * 0.47 + (point.y - scene.cameraY) * unit / scene.zoom,
  };
}

function cubic(a, b, c, d, t) {
  const v = 1 - t;
  return v * v * v * a + 3 * v * v * t * b + 3 * v * t * t * c + t * t * t * d;
}

/** A drawn constellation, rather than a bitmap portrait or a font outline. */
export function createFace(seed = SEED + 1) {
  const random = seededRandom(seed);
  const points = [];
  let line = 0;
  const add = (x, y, kind, weight = 1) => {
    const angle = random() * TAU;
    const radius = 0.2 + random() * 0.48;
    points.push({ x, y, kind, line, weight,
      orbitX: Math.cos(angle) * radius,
      orbitY: Math.sin(angle) * radius * 0.82,
      light: 0.45 + random() * 0.55,
      size: 0.5 + random() * 0.65,
      phase: random() * TAU });
  };
  const curve = (a, b, c, d, count, kind, weight = 1) => {
    line += 1;
    for (let i = 0; i < count; i++) {
      const t = i / Math.max(1, count - 1);
      add(cubic(a[0], b[0], c[0], d[0], t), cubic(a[1], b[1], c[1], d[1], t), kind, weight);
    }
  };
  // Oval, cheekbones and jaw.
  curve([-.185, -.29], [-.31, -.12], [-.23, .2], [-.14, .29], 34, 'skin');
  curve([-.14, .29], [-.06, .4], [.09, .4], [.17, .28], 29, 'skin');
  curve([.17, .28], [.28, .14], [.27, -.11], [.19, -.29], 34, 'skin');
  curve([-.185, -.29], [-.11, -.39], [.11, -.39], [.19, -.29], 35, 'skin');
  // Brows and smiling eyes.
  curve([-.19, -.12], [-.14, -.16], [-.085, -.15], [-.05, -.12], 18, 'gold', 1.3);
  curve([.05, -.12], [.1, -.15], [.16, -.15], [.2, -.1], 18, 'gold', 1.3);
  curve([-.185, -.065], [-.14, -.1], [-.085, -.1], [-.055, -.055], 19, 'skin', 1.2);
  curve([-.185, -.065], [-.14, -.035], [-.09, -.035], [-.055, -.055], 15, 'skin');
  curve([.055, -.055], [.1, -.095], [.16, -.09], [.195, -.05], 19, 'skin', 1.2);
  curve([.055, -.055], [.1, -.025], [.16, -.025], [.195, -.05], 15, 'skin');
  line += 1;
  for (const x of [-.118, .125]) {
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      add(x + Math.cos(a) * .009, -.062 + Math.sin(a) * .014, 'bright', 1.4);
    }
  }
  curve([.005, -.08], [-.005, -.005], [-.027, .06], [-.013, .075], 17, 'skin');
  curve([-.025, .075], [-.005, .092], [.025, .09], [.039, .071], 12, 'skin');
  // Open laughing mouth: two separate arcs around the same camera target.
  curve([-.087, .145], [-.035, .17], [.055, .18], [.11, .137], 26, 'mouth', 1.45);
  curve([-.087, .145], [-.035, .305], [.065, .29], [.11, .137], 34, 'mouth', 1.45);
  curve([-.07, .165], [-.02, .195], [.05, .195], [.09, .16], 20, 'bright', 1.1);
  curve([-.185, .025], [-.16, .045], [-.14, .065], [-.11, .079], 12, 'skin', .7);
  curve([.12, .082], [.15, .05], [.175, .04], [.195, .025], 12, 'skin', .7);
  // Hair moves from its own stable point along each strand, never random frame-to-frame.
  for (let strand = 0; strand < 15; strand++) {
    const t = strand / 14;
    const side = strand < 8 ? -1 : 1;
    const spread = (strand % 8) / 7;
    curve([-.22 + t * .42, -.32 - Math.sin(t * Math.PI) * .1],
      [side * (.31 + spread * .2), -.49 - spread * .04],
      [side * (.29 + spread * .27), .01 + spread * .17],
      [side * (.24 + spread * .26), .35 + spread * .12], 30, 'hair', .65 + spread * .5);
  }
  curve([-.11, .34], [-.115, .4], [-.23, .4], [-.34, .46], 24, 'gold', .6);
  curve([.12, .34], [.135, .4], [.25, .41], [.36, .46], 24, 'gold', .6);
  return points;
}

const PHASE_TEXT = {
  orbit: 'A face hidden in the stars. Select Fall in to explore.',
  form: 'The stars gather into a face.',
  flyin: 'Falling through a smile.',
  inside: 'A whole sky on the other side.',
  return: 'Returning to the constellation.',
};

/** Mount one independently disposable scene. No listeners on page keyboard events. */
export function mountFallIn(root) {
  if (!root) return { destroy() {}, start() {}, reset() {}, pause() {}, resume() {} };
  mounts.get(root)?.destroy();
  const canvas = root.querySelector('[data-fall-canvas]');
  const status = root.querySelector('[data-fall-status]');
  const startButton = root.querySelector('[data-fall-start]');
  const pauseButton = root.querySelector('[data-fall-pause]');
  const resetButton = root.querySelector('[data-fall-reset]');
  let context;
  try { context = canvas?.getContext('2d', { alpha: false }); } catch { /* optional enhancement */ }
  if (!context) {
    if (status) status.textContent = 'A constellation becomes a face, opening into a field of stars. Interactive canvas is unavailable in this browser.';
    return { destroy() {}, start() {}, reset() {}, pause() {}, resume() {} };
  }

  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = media.matches;
  let reducedFace = true;
  let elapsed = null;
  let paused = false;
  let visible = typeof IntersectionObserver === 'undefined';
  let destroyed = false;
  let frameId = 0;
  let lastTime = null;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let announced = '';
  const stars = createStars();
  const face = createFace();
  const colors = { skin: '#e8d4ba', gold: '#f0cb86', hair: '#ddb56a', mouth: '#ffb172', bright: '#fff3dc' };

  const updateUI = () => {
    const phase = elapsed === null ? 'orbit' : sampleJourney(elapsed).phase;
    root.dataset.fallState = reduced ? 'still' : phase;
    root.dataset.fallPaused = String(paused);
    if (startButton) startButton.textContent = reduced ? (reducedFace ? 'Show star field' : 'Show face') : (elapsed === null ? 'Fall in' : 'Restart journey');
    if (pauseButton) {
      pauseButton.disabled = reduced || elapsed === null;
      pauseButton.textContent = paused ? 'Resume motion' : 'Pause motion';
      pauseButton.setAttribute('aria-pressed', String(paused));
    }
    if (resetButton) resetButton.disabled = reduced ? reducedFace : elapsed === null;
    const text = reduced ? `Reduced motion: a still ${reducedFace ? 'face in the constellation' : 'star field'}.`
      : paused ? 'Journey paused. Resume motion or reset whenever you like.' : PHASE_TEXT[phase];
    if (status && text !== announced) { status.textContent = text; announced = text; }
  };

  const draw = () => {
    if (!width || !height || destroyed) return;
    const scene = reduced ? { ...sampleJourney(), face: reducedFace ? 1 : 0,
      faceOpacity: reducedFace ? 1 : 0 } : sampleJourney(elapsed);
    const time = elapsed ?? 0;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.fillStyle = '#080a0d';
    context.fillRect(0, 0, width, height);
    const halo = context.createRadialGradient(width * .52, height * .48, 0, width * .52, height * .48, Math.max(width, height) * .65);
    halo.addColorStop(0, '#191816');
    halo.addColorStop(.5, '#0d1015');
    halo.addColorStop(1, '#080a0d');
    context.fillStyle = halo;
    context.fillRect(0, 0, width, height);

    const centerX = width * .5;
    const centerY = height * .47;
    const starScale = Math.max(width, height) * .55;
    for (const star of stars) {
      const travel = scene.flight * .32;
      const depth = .12 + ((star.z - .12 - travel) % .88 + .88) % .88;
      const spread = (1 - scene.warp) + scene.warp / depth;
      const x = centerX + star.x * starScale * spread;
      const y = centerY + star.y * starScale * spread;
      if (x < -10 || y < -10 || x > width + 10 || y > height + 10) continue;
      const brightness = star.light * (.3 + scene.warp * .5) * (reduced ? .8 : 1);
      context.globalAlpha = brightness;
      context.fillStyle = star.light > .85 ? '#e4c48e' : '#c9c9d1';
      const size = star.size * (1 + scene.warp * .7);
      context.fillRect(x, y, size, size);
      if (scene.warp > .05) {
        const streak = scene.warp * .04;
        context.strokeStyle = star.light > .85 ? '#d7b77f' : '#adbcca';
        context.lineWidth = Math.max(.4, size * .35);
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x - (x - centerX) * streak, y - (y - centerY) * streak);
        context.stroke();
      }
    }
    context.globalAlpha = 1;

    // The mouth and glow share precisely the same camera transform.
    const mouth = projectPoint(MOUTH, scene, width, height);
    const glowRadius = Math.min(width, height) * (.12 + scene.warp * .28);
    const glow = context.createRadialGradient(mouth.x, mouth.y, 0, mouth.x, mouth.y, glowRadius);
    const glowAlpha = (reduced && !reducedFace) ? 0 : (.1 + scene.face * .12) * (1 - scene.warp * .5);
    glow.addColorStop(0, `rgba(223,124,47,${glowAlpha})`);
    glow.addColorStop(.22, `rgba(198,102,34,${glowAlpha * .45})`);
    glow.addColorStop(1, 'rgba(198,102,34,0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);

    let previous = null;
    for (const point of face) {
      const idleMix = scene.face;
      const wave = point.kind === 'hair' && !reduced && elapsed !== null
        ? Math.sin(time * .8 + point.y * 5 + point.phase * .08) * .008 * scene.face : 0;
      const position = {
        x: point.orbitX * (1 - idleMix) + (point.x + wave) * idleMix,
        y: point.orbitY * (1 - idleMix) + point.y * idleMix,
      };
      const projected = projectPoint(position, scene, width, height);
      if (scene.faceOpacity < .005 || projected.x < -10 || projected.y < -10 || projected.x > width + 10 || projected.y > height + 10) { previous = null; continue; }
      const radius = Math.min(2.8, point.size * point.weight * (0.8 + scene.face * .35) / Math.sqrt(scene.zoom));
      context.globalAlpha = scene.faceOpacity * point.light * (.45 + scene.face * .55);
      context.fillStyle = colors[point.kind];
      context.beginPath();
      context.arc(projected.x, projected.y, radius, 0, TAU);
      context.fill();
      if (previous && previous.line === point.line && scene.face > .82) {
        const landmark = point.kind === 'mouth' || point.kind === 'bright';
        const lineStrength = landmark ? .7 : point.kind === 'hair' ? .38 : .32;
        context.globalAlpha = scene.faceOpacity * lineStrength * (scene.face - .82) / .18;
        context.strokeStyle = colors[point.kind];
        context.lineWidth = point.kind === 'mouth' ? 1.15 : .8;
        context.beginPath();
        context.moveTo(previous.x, previous.y);
        context.lineTo(projected.x, projected.y);
        context.stroke();
      }
      previous = { ...projected, line: point.line };
    }
    context.globalAlpha = 1;
  };

  const cancelFrame = () => {
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = 0;
    lastTime = null;
  };
  const canRun = () => !destroyed && !reduced && !paused && visible && !document.hidden && elapsed !== null;
  const requestFrame = () => { if (canRun() && !frameId) frameId = window.requestAnimationFrame(frame); };
  const frame = (now) => {
    frameId = 0;
    if (!canRun()) { lastTime = null; return; }
    if (lastTime !== null) elapsed = advanceJourney(elapsed, Math.max(0, now - lastTime) / 1000);
    lastTime = now;
    draw();
    updateUI();
    if (elapsed === null) lastTime = null;
    requestFrame();
  };
  const resize = () => {
    if (destroyed) return;
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    draw();
  };
  const start = () => {
    if (destroyed) return;
    cancelFrame();
    if (reduced) { reducedFace = !reducedFace; elapsed = null; }
    else { elapsed = 0; paused = false; }
    updateUI(); draw(); requestFrame();
  };
  const reset = () => {
    if (destroyed) return;
    cancelFrame(); elapsed = null; paused = false; reducedFace = true;
    updateUI(); draw();
  };
  const pause = () => { if (destroyed || elapsed === null || reduced) return; paused = true; cancelFrame(); updateUI(); };
  const resume = () => { if (destroyed || elapsed === null || reduced) return; paused = false; updateUI(); requestFrame(); };
  const togglePause = () => paused ? resume() : pause();
  const onVisibility = () => { cancelFrame(); requestFrame(); };
  const onMotion = () => { reduced = media.matches; reset(); };
  const onPageHide = () => cancelFrame();
  const onPageShow = () => { resize(); requestFrame(); };

  startButton?.addEventListener('click', start);
  pauseButton?.addEventListener('click', togglePause);
  resetButton?.addEventListener('click', reset);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);
  window.addEventListener('resize', resize);
  if (media.addEventListener) media.addEventListener('change', onMotion);
  else media.addListener(onMotion);
  const intersection = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting; cancelFrame(); requestFrame();
  }, { threshold: 0.05 }) : null;
  intersection?.observe(canvas);
  const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  observer?.observe(canvas);
  root.dataset.fallReady = 'true';
  resize(); updateUI();

  const api = { start, reset, pause, resume, destroy() {
    if (destroyed) return;
    destroyed = true;
    cancelFrame();
    observer?.disconnect(); intersection?.disconnect();
    startButton?.removeEventListener('click', start);
    pauseButton?.removeEventListener('click', togglePause);
    resetButton?.removeEventListener('click', reset);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('pageshow', onPageShow);
    window.removeEventListener('resize', resize);
    if (media.removeEventListener) media.removeEventListener('change', onMotion);
    else media.removeListener(onMotion);
    delete root.dataset.fallReady;
    delete root.dataset.fallState;
    delete root.dataset.fallPaused;
    mounts.delete(root);
  } };
  mounts.set(root, api);
  return api;
}
