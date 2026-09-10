/* ============================================================================
   hours.js — bench item 01: the plate at two hours of day.

   The engraving graded twice and mixed continuously between: a night storm and
   a dawn forge. What makes it worth building is that it is not a colour swap.
   The weather changes with the hour — at night the discharge is at full
   strength and he is about to use it; at dawn the storm has passed, the
   lightning is nearly gone and the vent is the loudest thing left in the
   picture. Swapping only the palette would be a filter, which is exactly the
   thing this is trying not to be.

   On the profile this is bound to the reader's own light or dark theme through
   <picture> and prefers-color-scheme, so two different people open the same
   README and get different weather. Here it is a slider, because the useful
   discovery is that the interesting part is not either end — it is the twenty
   minutes in the middle.

   The hour is a shader uniform, not a second shader. Every colour in the grade
   is written as a pair, night and dawn, and one dial mixes them. That is the
   only reason a third hour would cost a column of numbers rather than a
   rewrite.

   ~940 KB of plate and masks, so nothing loads until this scrolls into view.
   ========================================================================== */

const ASSETS = "../assets/thor/";
const STOPS = [
  [0.00, "midnight", "the storm at full strength"],
  [0.35, "small hours", "the worst of it passing"],
  [0.70, "first light", "spent, and still warm"],
  [1.00, "dawn", "the forge is the only fire left"],
];

const load = (src) => new Promise((res, rej) => {
  const i = new Image();
  i.onload = () => res(i);
  i.onerror = () => rej(new Error(src));
  i.src = src;
});

/** The label for a position on the dial: nearest stop, so it reads as a time. */
function nameFor(h) {
  let best = STOPS[0];
  for (const s of STOPS) if (Math.abs(s[0] - h) < Math.abs(best[0] - h)) best = s;
  return best;
}

export function mount(host) {
  host.innerHTML = `
    <div class="hrs">
      <div class="hrs-stage">
        <canvas class="hrs-canvas" width="520" height="520"
                aria-label="Thor, engraved and graded, at an hour you choose."
                role="img"></canvas>
        <p class="hrs-fallback">Loading the plate…</p>
      </div>
      <div class="hrs-side">
        <label class="hrs-label" for="hrs-dial">
          <span class="hrs-time" data-time>midnight</span>
          <span class="hrs-note" data-note>the storm at full strength</span>
        </label>
        <input class="hrs-dial" id="hrs-dial" type="range"
               min="0" max="1" step="0.01" value="0"
               aria-label="Hour, from midnight to dawn">
        <div class="hrs-ends" aria-hidden="true">
          <span>night</span><span>dawn</span>
        </div>
        <ul class="hrs-what">
          <li><b>Sky</b> indigo storm → warm rose haze</li>
          <li><b>Overhead</b> nearly black → open dawn</li>
          <li><b>Vent</b> a glow → the loudest thing in frame</li>
          <li><b>Lightning</b> full → almost gone</li>
        </ul>
      </div>
    </div>`;

  const canvas = host.querySelector(".hrs-canvas");
  const dial = host.querySelector(".hrs-dial");
  const timeEl = host.querySelector("[data-time]");
  const noteEl = host.querySelector("[data-note]");
  const fallback = host.querySelector(".hrs-fallback");

  let thor = null;

  const setLabel = (h) => {
    const [, name, note] = nameFor(h);
    timeEl.textContent = name;
    noteEl.textContent = note;
  };

  dial.addEventListener("input", () => {
    const h = +dial.value;
    setLabel(h);
    if (thor) thor.setHour(h);
  });

  /* Deferred. Nobody who never scrolls this far should pay for the plate. */
  const io = new IntersectionObserver(async (entries, obs) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    obs.disconnect();
    try {
      const [{ createThor }, plate, masks, grade] = await Promise.all([
        import("../../thor/thor.js"),
        load(ASSETS + "plate.webp"),
        load(ASSETS + "masks.webp"),
        load(ASSETS + "grade.webp"),
      ]);

      const dpr = Math.min(2, devicePixelRatio || 1);
      const css = canvas.getBoundingClientRect().width || 420;
      canvas.width = canvas.height = Math.round(css * dpr);

      thor = createThor(canvas, {
        src: plate, mask: masks, grade,
        crop: [236, 18, 1006, 788],   // the bust — head, hammer, and the plume
        loop: 8, cycles: 2,
        hour: +dial.value,
      });

      fallback.remove();
      host.querySelector(".hrs").classList.add("is-live");

      /* Only while it is on screen and the tab is in front. A shader running
         behind a scrolled-past section is a battery costing nothing visible. */
      let onScreen = true;
      const vis = new IntersectionObserver(([e]) => {
        onScreen = e.isIntersecting;
        onScreen && !document.hidden ? thor.start() : thor.stop();
      }, { threshold: 0.05 });
      vis.observe(canvas);
      document.addEventListener("visibilitychange", () => {
        document.hidden || !onScreen ? thor.stop() : thor.start();
      });
      thor.start();
    } catch (err) {
      // The article around it still reads without the toy.
      console.warn("hours exhibit did not load:", err);
      host.hidden = true;
    }
  }, { rootMargin: "300px" });

  io.observe(host);
  setLabel(0);
}
