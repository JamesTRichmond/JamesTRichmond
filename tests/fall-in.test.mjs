import test from 'node:test';
import assert from 'node:assert/strict';
import { DURATIONS, JOURNEY_SECONDS, MOUTH, advanceJourney, createFace, createStars,
  mountFallIn, projectPoint, sampleJourney } from '../assets/js/fall-in.js';

const close = (actual, expected, epsilon = 1e-8) => assert.ok(
  Math.abs(actual - expected) < epsilon, `${actual} differs from ${expected}`);

test('journey advances through formation, mouth, inside sky, and return', () => {
  assert.equal(sampleJourney().phase, 'orbit');
  assert.equal(sampleJourney(0).phase, 'form');
  assert.equal(sampleJourney(DURATIONS.form).phase, 'flyin');
  assert.equal(sampleJourney(DURATIONS.form + DURATIONS.flyin).phase, 'inside');
  assert.equal(sampleJourney(DURATIONS.form + DURATIONS.flyin + DURATIONS.inside).phase, 'return');
  assert.equal(sampleJourney(JOURNEY_SECONDS).phase, 'orbit');
  assert.equal(sampleJourney(JOURNEY_SECONDS).done, true);
});

test('resting face is fully recognizable and formation starts only on request', () => {
  assert.equal(sampleJourney().face, 1);
  assert.equal(sampleJourney(0).face, 1);
  assert.ok(sampleJourney(DURATIONS.form * 0.16).face < 0.4);
  assert.ok(sampleJourney(DURATIONS.form - 1e-8).face > 0.99);
  assert.equal(sampleJourney(JOURNEY_SECONDS).face, 1);
});

test('camera and opacity remain continuous across journey phases', () => {
  for (const boundary of [DURATIONS.form, DURATIONS.form + DURATIONS.flyin,
    DURATIONS.form + DURATIONS.flyin + DURATIONS.inside, JOURNEY_SECONDS]) {
    const before = sampleJourney(boundary - 1e-8);
    const after = sampleJourney(boundary);
    for (const key of ['face', 'zoom', 'cameraX', 'cameraY', 'warp', 'faceOpacity']) {
      close(before[key], after[key], 1e-6);
    }
  }
});

test('mouth camera target projects to the same center at different sizes and zooms', () => {
  for (const [width, height] of [[280, 300], [640, 560], [1200, 800]]) {
    const inside = sampleJourney(DURATIONS.form + DURATIONS.flyin + 1);
    close(inside.zoom, 0.08);
    const projected = projectPoint(MOUTH, inside, width, height);
    close(projected.x, width * 0.5);
    close(projected.y, height * 0.47);
  }
});

test('elapsed-time sampling gives equivalent scenes across frame cadences', () => {
  const times = [];
  for (const frames of [30, 60, 120, 144]) {
    let elapsed = 0;
    for (let frame = 0; frame < frames * 5; frame++) elapsed = advanceJourney(elapsed, 1 / frames);
    times.push(elapsed);
  }
  for (const elapsed of times) {
    close(elapsed, 5);
    const actual = sampleJourney(elapsed);
    const expected = sampleJourney(5);
    assert.equal(actual.phase, expected.phase);
    close(actual.progress, expected.progress);
    close(actual.zoom, expected.zoom);
  }
});

test('pausing and invalid deltas do not advance; finishing returns to idle', () => {
  assert.equal(advanceJourney(3, 1, false), 3);
  assert.equal(advanceJourney(3, NaN), 3);
  assert.equal(advanceJourney(3, -1), 3);
  assert.equal(advanceJourney(null, 1), null);
  assert.equal(advanceJourney(JOURNEY_SECONDS - 0.1, 0.2), null);
});

test('repeated journeys never consume or mutate deterministic stars and face geometry', () => {
  const stars = createStars();
  const face = createFace();
  const original = JSON.stringify({ stars, face });
  assert.equal(stars.length, 800);
  assert.ok(face.length > 500);
  for (let repeat = 0; repeat < 5; repeat++) {
    for (let elapsed = 0; elapsed <= JOURNEY_SECONDS; elapsed += 0.1) {
      const scene = sampleJourney(elapsed);
      for (const point of face) projectPoint(point, scene, 440, 400);
    }
  }
  assert.equal(JSON.stringify({ stars, face }), original);
  assert.deepEqual(createStars(), stars);
  assert.deepEqual(createFace(), face);
  assert.notDeepEqual(createStars(800, 123), stars);
});

class Target {
  listeners = new Map();
  addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(fn); }
  removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); }
  dispatch(type) { for (const fn of [...(this.listeners.get(type) || [])]) fn({ type }); }
  count() { return [...this.listeners.values()].reduce((sum, value) => sum + value.size, 0); }
}

function environment({ reduced = false, visible = true, context = true } = {}) {
  const previous = Object.fromEntries(['window', 'document', 'IntersectionObserver', 'ResizeObserver']
    .map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const window = new Target();
  const document = new Target();
  const media = new Target();
  media.matches = reduced;
  document.hidden = false;
  const frames = new Map();
  let nextFrame = 1;
  window.requestAnimationFrame = (fn) => { const id = nextFrame++; frames.set(id, fn); return id; };
  window.cancelAnimationFrame = (id) => frames.delete(id);
  window.matchMedia = () => media;
  window.devicePixelRatio = 3;
  const observers = [];
  class Observer {
    constructor(fn) { this.fn = fn; this.disconnected = false; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  Object.assign(globalThis, { window, document, IntersectionObserver: Observer, ResizeObserver: Observer });
  const drawCalls = { count: 0 };
  const drawing = new Proxy({}, { get: (_, key) => key === 'createRadialGradient'
    ? () => ({ addColorStop() {} }) : () => { drawCalls.count++; }, set: () => true });
  const canvas = { width: 0, height: 0, getContext: () => context ? drawing : null,
    getBoundingClientRect: () => ({ width: 440, height: 400 }) };
  const elements = Object.fromEntries(['start', 'pause', 'reset'].map((key) => {
    const element = new Target();
    element.setAttribute = (name, value) => { element[name] = value; };
    return [key, element];
  }));
  const status = { textContent: '' };
  const root = { dataset: {}, querySelector(selector) {
    if (selector === '[data-fall-canvas]') return canvas;
    if (selector === '[data-fall-status]') return status;
    return elements[selector.replace('[data-fall-', '').replace(']', '')];
  } };
  const api = mountFallIn(root);
  if (context) observers[0].fn([{ isIntersecting: visible }]);
  return { api, root, canvas, elements, status, document, media, window, frames, observers, drawCalls,
    tick(time) { const pending = [...frames.values()]; frames.clear(); for (const fn of pending) fn(time); },
    restore() { api.destroy(); for (const [key, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    } } };
}

test('mount stays still until requested and caps the canvas backing resolution', () => {
  const env = environment();
  try {
    assert.equal(env.frames.size, 0);
    assert.equal(env.canvas.width, 880);
    assert.equal(env.canvas.height, 800);
    assert.equal(env.root.dataset.fallState, 'orbit');
    env.elements.start.dispatch('click');
    assert.equal(env.frames.size, 1);
    env.elements.start.dispatch('click');
    assert.equal(env.frames.size, 1, 'restarting must not duplicate the loop');
  } finally { env.restore(); }
});

test('pause, hidden tabs and offscreen scenes suspend and resume without charging hidden time', () => {
  const env = environment();
  try {
    env.api.start(); env.tick(1000); env.tick(2000);
    env.api.pause();
    assert.equal(env.frames.size, 0);
    assert.equal(env.root.dataset.fallPaused, 'true');
    env.api.resume(); env.tick(60000);
    assert.equal(env.root.dataset.fallState, 'form');
    env.document.hidden = true; env.document.dispatch('visibilitychange');
    assert.equal(env.frames.size, 0);
    env.document.hidden = false; env.document.dispatch('visibilitychange'); env.tick(120000);
    assert.equal(env.root.dataset.fallState, 'form');
    env.observers[0].fn([{ isIntersecting: false }]);
    assert.equal(env.frames.size, 0);
    env.observers[0].fn([{ isIntersecting: true }]); env.tick(240000);
    assert.equal(env.root.dataset.fallState, 'form');
    env.api.reset();
    assert.equal(env.frames.size, 0);
    assert.equal(env.root.dataset.fallState, 'orbit');
  } finally { env.restore(); }
});

test('dynamic reduced-motion changes replace travel with still choices', () => {
  const env = environment();
  try {
    env.api.start();
    env.media.matches = true; env.media.dispatch('change');
    assert.equal(env.frames.size, 0);
    assert.equal(env.root.dataset.fallState, 'still');
    assert.equal(env.elements.pause.disabled, true);
    env.api.start();
    assert.equal(env.frames.size, 0);
    assert.match(env.status.textContent, /still star field/);
    env.api.reset();
    assert.match(env.status.textContent, /still face/);
    env.media.matches = false; env.media.dispatch('change');
    assert.equal(env.root.dataset.fallState, 'orbit');
    assert.equal(env.frames.size, 0);
  } finally { env.restore(); }
});

test('a complete journey resets and can be replayed with no lingering frames', () => {
  const env = environment();
  try {
    for (let repeat = 0; repeat < 3; repeat++) {
      env.api.start(); env.tick(1000); env.tick(11000);
      assert.equal(env.root.dataset.fallState, 'orbit');
      assert.equal(env.frames.size, 0);
      assert.equal(env.elements.start.textContent, 'Fall in');
    }
  } finally { env.restore(); }
});

test('destroy removes listeners, observers and frames; disposed API is inert', () => {
  const env = environment();
  try {
    env.api.start(); env.api.destroy();
    assert.equal(env.frames.size, 0);
    assert.equal(env.window.count() + env.document.count() + env.media.count(), 0);
    assert.equal(Object.values(env.elements).reduce((sum, element) => sum + element.count(), 0), 0);
    assert.ok(env.observers.every((observer) => observer.disconnected));
    const calls = env.drawCalls.count;
    const dataset = { ...env.root.dataset };
    env.api.start(); env.api.reset(); env.api.resume(); env.api.pause(); env.api.destroy();
    assert.equal(env.drawCalls.count, calls);
    assert.deepEqual(env.root.dataset, dataset);
  } finally { env.restore(); }
});

test('remount disposes the previous scene instead of adding a second set of listeners', () => {
  const env = environment();
  try {
    env.api.start();
    const newer = mountFallIn(env.root);
    assert.ok(env.observers.slice(0, 2).every((observer) => observer.disconnected));
    assert.equal(env.frames.size, 0);
    assert.equal(env.elements.start.count(), 1);
    newer.destroy();
  } finally { env.restore(); }
});

test('missing or unsupported canvas degrades without frames or active controls', () => {
  const empty = mountFallIn(null);
  empty.start(); empty.destroy();
  const env = environment({ context: false });
  try {
    assert.match(env.status.textContent, /unavailable/);
    assert.equal(env.frames.size, 0);
    assert.equal(env.root.dataset.fallReady, undefined);
  } finally { env.restore(); }
});
