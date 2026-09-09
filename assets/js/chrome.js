/* ============================================================================
   chrome.js — the parts every page wears: the flavor switcher and the single
   animation loop. Extracted so the home page and the six subject pages share
   one implementation rather than six copies that drift.
   ========================================================================== */

/** Wire the three chocolate swatches. The pre-paint script in each page's
 *  <head> has already applied the saved flavor; this only handles changes. */
export function initFlavors() {
  const root = document.documentElement;
  const fieldset = document.querySelector("[data-flavors]");
  if (!fieldset) return;

  const sync = () => {
    const current = root.dataset.flavor;
    for (const input of fieldset.querySelectorAll("input")) {
      input.checked = input.value === current;
    }
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.content = current === "white" ? "light" : "dark";
  };
  sync();

  fieldset.addEventListener("change", (e) => {
    const flavor = e.target.value;
    const apply = () => {
      root.dataset.flavor = flavor;
      localStorage.setItem("flavor", flavor);
      sync();
    };
    // Morph rather than snap, where the browser can.
    if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.startViewTransition(apply);
    } else {
      apply();
    }
  });
}

/**
 * One requestAnimationFrame loop for the whole page.
 *
 * @param {(dt: number) => void} tick  called with clamped seconds since the
 *   last frame. The clamp matters: a backgrounded tab hands you a delta
 *   measured in minutes, and anything integrating against it teleports.
 * @returns {{ start(): void, stop(): void }}
 */
export function loop(tick) {
  let raf = 0;
  let last = performance.now();

  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    tick(dt);
  };

  const start = () => {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  return { start, stop };
}

/** A stable 32-bit seed from a string, so each page gets its own sky. */
export function seedFrom(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
