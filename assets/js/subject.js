/* ============================================================================
   subject.js — boot for the six subject pages.

   Every subject page is the same skeleton: the shape field behind everything,
   the flavor switcher in the bar, and the robot in a room that belongs to the
   subject. Whatever is particular to a page — a missile, an interpreter, a
   type checker — lives in its own module under assets/js/exhibits/ and is
   imported here by name, lazily, so a page only pays for its own centrepiece.
   ========================================================================== */

import { mountHypershapes } from "./hypershapes.js";
import { initFlavors, loop, seedFrom } from "./chrome.js";
import { createHabitat } from "../habitat/habitat.js";
import { docentOptions } from "../habitat/subject.js";

async function boot() {
  const subject = document.documentElement.dataset.subject || "";

  initFlavors();

  /* ── the sky ─────────────────────────────────────────────────────────── */
  const sky = document.querySelector("[data-hypershapes]");
  if (sky) {
    // Seeded off the page name, so every room gets a different arrangement of
    // the same geometry rather than the identical field six times.
    const shapes = mountHypershapes(sky, { seed: seedFrom(subject || location.pathname) });
    shapes.prime();
    loop((dt) => shapes.update(dt)).start();
  }

  /* ── the docent ──────────────────────────────────────────────────────── */
  const host = document.querySelector("[data-docent]");
  const opts = docentOptions(subject);
  if (host && opts) {
    const { caption, start, ...habitatOptions } = opts;
    const habitat = createHabitat(host, habitatOptions);
    habitat.command(start);
    // He is on a job with no end, so if anything ever knocks him back to idle
    // — a drag, a click — put him back to work rather than leaving him
    // standing in a room built for one activity.
    let nudge = 0;
    host.addEventListener("pointerup", () => {
      clearTimeout(nudge);
      nudge = setTimeout(() => habitat.command(start), 2600);
    });
  }

  /* ── the centrepiece ─────────────────────────────────────────────────── */
  const exhibit = document.querySelector("[data-exhibit]");
  if (exhibit) {
    const name = exhibit.dataset.exhibit;
    try {
      const mod = await import(`./exhibits/${name}.js`);
      mod.mount(exhibit);
    } catch (err) {
      // An exhibit that fails to load should cost the page its interactive
      // toy and nothing else — the article around it still reads.
      console.warn(`exhibit "${name}" did not load:`, err);
      exhibit.hidden = true;
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
