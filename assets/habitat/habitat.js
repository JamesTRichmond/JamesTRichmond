/* ============================================================================
   habitat.js — the public entry point.

     import { createHabitat } from "./src/habitat.js";
     const habitat = createHabitat(document.querySelector("#habitat"));

   Everything the robot needs is built here: the SVG, its gradients, and the
   theme variables the scenery and the rig draw themselves with. Nothing is
   expected of the host page beyond an element to live in — no stylesheet, no
   build step, no dependencies.
   ========================================================================== */

import { Robot } from "./robot.js";
import { SCENES as DEFAULT_SCENES, PROPS } from "./scenes.js";
import { ACTIVITIES as DEFAULT_ACTIVITIES } from "./activities.js";
import { up } from "./rig.js";

const SVG_NS = "http://www.w3.org/2000/svg";

/** Warm workshop dark. Every value is overridable through `theme`. */
export const DEFAULT_THEME = {
  bg: "#150f0d",          // the deepest ground, and the floor
  surface: "#241a15",     // walls, asphalt
  raised: "#33251d",      // benches, shelves, rock
  line: "rgba(120, 96, 78, 0.55)",
  ink: "#f3ece3",
  inkDim: "#b6a08c",
  accent: "#f2cf4a",      // the highlight color: lamps, road lines, his belt
  glow: "#b06cf5",        // his core, and anything that should look energized
  visor: "#40f58a",       // his eye
  chassis: "#9c7c5e",     // his body
  chassisHi: "#c0a487",   // lit edges
  chassisLo: "#5e4735",   // the far side of him, and shadowed parts
};

const THEME_VARS = {
  bg: "--hb-bg", surface: "--hb-surface", raised: "--hb-raised", line: "--hb-line",
  ink: "--hb-ink", inkDim: "--hb-ink-dim", accent: "--hb-accent",
  glow: "--hb-glow", visor: "--hb-visor",
  chassis: "--hb-chassis", chassisHi: "--hb-chassis-hi", chassisLo: "--hb-chassis-lo",
};

const BASE_CSS = `
  .hb-root { position: relative; overflow: hidden; touch-action: none; cursor: grab;
             background: var(--hb-bg); contain: layout paint style; }
  .hb-root:active { cursor: grabbing; }
  .hb-svg { display: block; width: 100%; height: 100%; }
  .hb-status { position: absolute; inset-block-end: .55rem; inset-inline-start: .7rem;
               margin: 0; font: 500 .7rem/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
               letter-spacing: .06em; text-transform: uppercase; color: var(--hb-ink-dim);
               background: color-mix(in oklab, var(--hb-bg) 72%, transparent);
               padding: .2rem .55rem; border-radius: 999px; pointer-events: none; }
`;

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  const style = document.createElement("style");
  style.dataset.habitat = "";
  style.textContent = BASE_CSS;
  document.head.appendChild(style);
  stylesInjected = true;
}

/**
 * @param {Element} host        where he lives. Give it a size; he fills it.
 * @param {object}  [options]
 * @param {object}  [options.theme]       partial override of DEFAULT_THEME
 * @param {object}  [options.scenes]      scene registry; defaults to the four built in
 * @param {object}  [options.activities]  activity registry; defaults to the five built in
 * @param {string}  [options.scene]       which scene to open in
 * @param {boolean} [options.autonomy]    let him wander off on his own (default true)
 * @param {number}  [options.boredom]     seconds alone before he does (default 11)
 * @param {boolean} [options.status]      draw the little state label (default true)
 * @param {boolean} [options.keyboard]    arrow keys / WASD / space (default true)
 * @param {boolean} [options.pointer]     drag, throw, click to greet (default true)
 * @param {Function}[options.onState]     called with the state name on every change
 */
export function createHabitat(host, options = {}) {
  if (!host) throw new Error("createHabitat: no host element");
  injectStyles();

  const {
    theme = {},
    scenes = DEFAULT_SCENES,
    activities = DEFAULT_ACTIVITIES,
    scene = Object.keys(scenes)[0],
    autonomy = true,
    boredom = 11,
    status = true,
    keyboard = true,
    pointer = true,
    onState,
  } = options;

  host.classList.add("hb-root");
  const palette = { ...DEFAULT_THEME, ...theme };
  for (const [key, cssVar] of Object.entries(THEME_VARS)) {
    if (palette[key] != null) host.style.setProperty(cssVar, palette[key]);
  }

  // Gradient ids are namespaced, so two habitats on one page don't collide.
  const uid = `hb${Math.random().toString(36).slice(2, 8)}`;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "hb-svg");
  svg.setAttribute("viewBox", "0 0 1200 520");
  svg.setAttribute("preserveAspectRatio", "xMidYMax slice");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = `
    <defs>
      <linearGradient id="${uid}-visor" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="var(--hb-visor)" stop-opacity=".65"/>
        <stop offset=".5" stop-color="var(--hb-visor)"/>
        <stop offset="1" stop-color="var(--hb-visor)" stop-opacity=".65"/>
      </linearGradient>
      <radialGradient id="${uid}-core">
        <stop offset="0" stop-color="var(--hb-glow)"/>
        <stop offset="1" stop-color="var(--hb-glow)" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <g data-scene></g><g data-fx></g><g data-pet></g><g data-fg></g>`;
  host.appendChild(svg);

  let statusEl = null;
  if (status) {
    statusEl = document.createElement("p");
    statusEl.className = "hb-status";
    statusEl.setAttribute("aria-live", "polite");
    host.appendChild(statusEl);
  }

  if (!host.hasAttribute("tabindex")) host.tabIndex = 0;
  if (!host.hasAttribute("role")) host.setAttribute("role", "application");
  if (!host.hasAttribute("aria-label")) {
    host.setAttribute("aria-label",
      "A robot habitat. Arrow keys to walk, space to jump, drag him to pick him up.");
  }

  const robot = new Robot({
    sceneLayer: svg.querySelector("[data-scene]"),
    fxLayer: svg.querySelector("[data-fx]"),
    petLayer: svg.querySelector("[data-pet]"),
    fgLayer: svg.querySelector("[data-fg]"),
    propsMarkup: PROPS,
    statusEl,
    scenes,
    activities,
    scene,
    autonomy,
    boredom,
    uid,
    onStateChange: onState,
  });

  /* ── input ───────────────────────────────────────────────────────────── */

  const cleanup = [];
  const on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    cleanup.push(() => target.removeEventListener(type, fn, opts));
  };

  /** Client point → the SVG's own coordinates. preserveAspectRatio is "slice",
   *  so the viewBox is cropped rather than letterboxed. */
  const toLocal = (evt) => {
    const r = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const k = Math.max(r.width / vb.width, r.height / vb.height);
    return {
      x: (evt.clientX - r.left - (r.width - vb.width * k) / 2) / k,
      y: (evt.clientY - r.top - (r.height - vb.height * k) / 2) / k,
    };
  };

  const keys = new Set();
  if (keyboard) {
    // Scoped to the habitat, so arrow keys never steal the page's scroll.
    let hovering = false;
    on(host, "pointerenter", () => { hovering = true; });
    on(host, "pointerleave", () => { hovering = false; });
    const listening = () => hovering || document.activeElement === host;

    const WATCHED = ["arrowleft", "arrowright", "arrowup", " ", "a", "d", "w"];
    on(window, "keydown", (e) => {
      const k = e.key.toLowerCase();
      if (!listening() || !WATCHED.includes(k)) return;
      e.preventDefault();
      keys.add(k);
    });
    on(window, "keyup", (e) => keys.delete(e.key.toLowerCase()));
    on(window, "blur", () => keys.clear());
  }

  if (pointer) {
    let dragging = false, moved = false, downAt = null;

    on(host, "pointerdown", (e) => {
      const pt = toLocal(e);
      downAt = pt; moved = false;
      if (Math.hypot(pt.x - robot.x, pt.y - (robot.y - up(90))) < up(105)) {
        dragging = true;
        host.setPointerCapture(e.pointerId);
        robot.grab(pt.x, pt.y);
      }
    });

    on(host, "pointermove", (e) => {
      const pt = toLocal(e);
      robot.lookAt(pt.x, pt.y);
      if (!dragging) return;
      if (Math.hypot(pt.x - downAt.x, pt.y - downAt.y) > 12) moved = true;
      robot.dragTo(pt.x, pt.y);
    });

    on(host, "pointerup", (e) => {
      if (dragging) {
        dragging = false;
        if (moved) robot.release();
        else { robot.setState("idle"); robot.greet(); }
      } else if (downAt) {
        robot.walkTo(toLocal(e).x);
      }
      downAt = null;
    });

    on(host, "pointercancel", () => {
      if (dragging) { dragging = false; robot.release(); }
      downAt = null;
    });
  }

  /* ── loop ────────────────────────────────────────────────────────────── */

  let raf = 0, last = 0, onScreen = true, paused = false;
  const input = { dir: 0, jump: false };

  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);   // a slow frame must not teleport him
    last = now;
    input.dir = (keys.has("arrowright") || keys.has("d") ? 1 : 0) -
                (keys.has("arrowleft") || keys.has("a") ? 1 : 0);
    input.jump = keys.has(" ") || keys.has("arrowup") || keys.has("w");
    if (input.dir || input.jump) robot.handleInput(input);
    else if (robot.state === "walk" && robot.grounded) { robot.vx = 0; robot.setState("idle"); }
    robot.update(dt, input);
  };

  const start = () => {
    if (raf || paused || !onScreen || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  // He costs nothing while off-screen or in a background tab.
  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    onScreen ? start() : stop();
  }, { rootMargin: "120px" });
  io.observe(host);
  cleanup.push(() => io.disconnect());

  on(document, "visibilitychange", () => (document.hidden ? stop() : start()));
  start();

  return {
    /** Send him to do something: any activity name, or "idle" to come home. */
    command(name) { name === "idle" ? robot.goHome() : robot.startActivity(name); },
    get state() { return robot.state; },
    get scene() { return robot.scene; },
    get activities() { return Object.keys(activities); },
    pause() { paused = true; stop(); },
    resume() { paused = false; start(); },
    destroy() {
      stop();
      for (const off of cleanup) off();
      host.classList.remove("hb-root");
      svg.remove();
      statusEl?.remove();
    },
  };
}

export { SCENES, PROPS } from "./scenes.js";
export { ACTIVITIES } from "./activities.js";
