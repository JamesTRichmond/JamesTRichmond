/* ============================================================================
   minuteman.js — the LGM-30G, drawn to scale, with the three warheads that
   have ridden on the front of it swappable on the nose.

   Every number in here is off a public fact sheet, and the source is named in
   the panel rather than left implied. The proportions are real: stage lengths
   are taken from the published 18.2 m total and drawn at one scale, so the
   third stage looks as short as it actually is.
   ========================================================================== */

const SVG_NS = "http://www.w3.org/2000/svg";

/* Drawn at 800px for 18.2 m — about 44 px per metre. */
const PARTS = [
  {
    id: "s1", label: "1st stage", x0: 40, x1: 370, r: 37,
    title: "First stage",
    sub: "Thiokol M55 · solid propellant",
    rows: [
      ["Thrust", "203,158 lbf"],
      ["Burns for", "about 60 seconds"],
      ["Job", "Off the pad and out of the thick air"],
    ],
    note: "Solid propellant is the whole reason a missile can sit in a hole for fifty years and still be a minute from ready. Liquid fuel has to be loaded first, and that is a decision you can watch someone make.",
  },
  {
    id: "s2", label: "2nd stage", x0: 370, x1: 550, r: 37,
    title: "Second stage",
    sub: "Aerojet SR19 · solid propellant",
    rows: [
      ["Thrust", "60,793 lbf"],
      ["Job", "Through most of what is left of the atmosphere"],
    ],
    note: "Thrust falls by two thirds from the stage below it, and that is not a weakness — there is far less mass and far less air left to fight.",
  },
  {
    id: "s3", label: "3rd stage", x0: 550, x1: 651, r: 29,
    title: "Third stage",
    sub: "Aerojet SR73 · solid propellant",
    rows: [
      ["Thrust", "35,086 lbf"],
      ["Burnout speed", "about 15,000 mph — Mach 23"],
      ["Ceiling", "700 miles"],
    ],
    note: "At burnout it is going roughly twenty times faster than a rifle bullet and is well outside the atmosphere. Everything after this is orbital mechanics.",
  },
  {
    id: "pbps", label: "Post-boost", x0: 651, x1: 700, r: 26,
    title: "Post-boost propulsion system",
    sub: "Liquid propellant · the only liquid on the vehicle",
    rows: [
      ["Job", "Fine positioning after the solids are spent"],
      ["Guidance", "Inertial — no signal in, no signal out"],
    ],
    note: "The one small liquid engine on an otherwise entirely solid missile. It is what turns a very fast rock into something aimed.",
  },
  {
    id: "rv", label: "Reentry vehicle", x0: 700, x1: 848, r: 26,
    title: "The reentry vehicle",
    sub: "One per missile since 2014",
    rows: [
      ["Carried", "One warhead"],
      ["Flight time", "Roughly 30 minutes to anywhere"],
    ],
    note: "This is the part the munitions squadron owns. Pick a warhead below and the nose changes shape, because they genuinely are different shapes.",
    warheadSlot: true,
  },
];

const WARHEADS = {
  w62: {
    name: "W62", rv: "Mk-12", lab: "Lawrence Livermore",
    years: "1970 – 2010", yield: "170 kt",
    // nose profile: blunter, shorter
    nose: { len: 128, blunt: 12 },
    rows: [
      ["Reentry vehicle", "Mk-12"],
      ["Designed at", "Lawrence Livermore"],
      ["In service", "1970 – 2010"],
      ["Yield", "170 kilotons"],
      ["Status", "Retired from the field in 2010; dismantlement completed at Pantex, announced August 2010"],
    ],
    note: "The oldest one in the field, and it predates the modern safety set — no insensitive high explosive, no fire-resistant pit. It is the reason the W87 swap mattered.",
    safety: 1,
  },
  w78: {
    name: "W78", rv: "Mk-12A", lab: "Los Alamos",
    years: "1979 – present", yield: "335 kt",
    nose: { len: 140, blunt: 8 },
    rows: [
      ["Reentry vehicle", "Mk-12A"],
      ["Designed at", "Los Alamos"],
      ["In service", "Deployed on Minuteman III from December 1979"],
      ["Yield", "about 335 kilotons"],
      ["Status", "Still deployed. Being replaced by the W87-1, an all-new build whose first plutonium pit was stamped at Los Alamos in October 2024"],
    ],
    note: "The higher-yield option, and the one still going. Its replacement is the first genuinely new US warhead build in decades.",
    safety: 2,
  },
  w87: {
    name: "W87", rv: "Mk-21", lab: "Lawrence Livermore",
    years: "1986 – present", yield: "300 kt",
    nose: { len: 150, blunt: 6 },
    rows: [
      ["Reentry vehicle", "Mk-21"],
      ["Designed at", "Lawrence Livermore"],
      ["In service", "First production unit at Pantex, March 1986"],
      ["Yield", "300 kilotons"],
      ["Status", "Originally the Peacekeeper warhead — ten to a missile. Moved onto Minuteman III from 2006 as Peacekeeper retired"],
    ],
    note: "Insensitive high explosive and a fire-resistant pit rated to survive a thousand-degree fire for hours. Engineered so that a crash or a fire ends as a very bad day and not as a yield.",
    safety: 3,
  },
};

const SAFETY_MARKS = [
  "Neither. Built before the modern set.",
  "Insensitive high explosive.",
  "Insensitive high explosive and a fire-resistant pit.",
];

const CSS = `
.mm { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); gap: clamp(1rem, 3vw, 2rem); align-items: start; }
@media (width < 54rem) { .mm { grid-template-columns: minmax(0, 1fr); } }

.mm-svg { display: block; inline-size: 100%; block-size: auto; overflow: visible; }
.mm-part { cursor: pointer; }
/* Mixed toward the ink rather than set flat: this darkens the airframe on
   cream and lightens it on cocoa, so it has contrast against the exhibit card
   in all three chocolates without a per-flavor rule. */
.mm-body { fill: color-mix(in oklab, var(--raised) 86%, var(--ink)); stroke: var(--line); stroke-width: 1.5; transition: fill .18s; }
.mm-shadow { fill: var(--bg-deep); opacity: .5; }
.mm-part:hover .mm-body, .mm-part.on .mm-body { fill: color-mix(in oklab, var(--sub) 34%, var(--raised)); }
.mm-part.on .mm-body { stroke: var(--sub); }
.mm-seam { stroke: var(--bg-deep); stroke-width: 2; opacity: .5; }
.mm-tick { stroke: var(--line); stroke-width: 1.5; }
.mm-tick-t { fill: var(--ink-dim); font-family: var(--font-mono); font-size: 15px; }
.mm-flame { fill: var(--sub-2); opacity: .55; }

.mm-tabs { display: flex; flex-wrap: wrap; gap: .35rem; margin-block-start: .9rem; }
.mm-tab, .mm-wh {
  font-family: var(--font-mono); font-size: .72rem; padding: .34rem .7rem;
  border-radius: 999px; border: 1px solid var(--line); background: transparent;
  color: var(--ink-dim); cursor: pointer; transition: color .16s, border-color .16s;
}
.mm-tab:hover, .mm-wh:hover { color: var(--ink); border-color: var(--sub); }
.mm-tab[aria-pressed="true"], .mm-wh[aria-pressed="true"] {
  background: var(--sub); border-color: transparent; color: var(--sub-on); font-weight: 600;
}

.mm-panel { border-inline-start: 2px solid var(--sub); padding-inline-start: 1.1rem; min-block-size: 15rem; }
@media (width < 54rem) { .mm-panel { border-inline-start: 0; border-block-start: 2px solid var(--sub); padding: 1.1rem 0 0; } }
.mm-panel h4 { margin: 0; font-size: 1.15rem; font-weight: 700; letter-spacing: -.015em; }
.mm-panel .mm-sub { margin: .2rem 0 1rem; font-family: var(--font-mono); font-size: .72rem; color: var(--ink-dim); }
.mm-rows { margin: 0 0 1rem; display: grid; grid-template-columns: auto 1fr; gap: .4rem .9rem; font-size: .86rem; }
.mm-rows dt { font-family: var(--font-mono); font-size: .72rem; color: var(--ink-dim); white-space: nowrap; padding-block-start: .15rem; }
.mm-rows dd { margin: 0; color: var(--ink); text-wrap: pretty; }
.mm-note { margin: 0; font-size: .88rem; line-height: 1.6; color: var(--ink-dim); text-wrap: pretty; }

.mm-safety { margin-block-start: 1.1rem; }
.mm-safety-l { font-family: var(--font-mono); font-size: .68rem; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-dim); }
.mm-pips { display: flex; gap: .3rem; margin-block: .4rem .35rem; }
.mm-pip { inline-size: 2.4rem; block-size: .4rem; border-radius: 99px; background: var(--line); }
.mm-pip.on { background: var(--sub); }
.mm-safety-t { font-size: .82rem; color: var(--ink); }

@media (prefers-reduced-motion: reduce) { .mm-body { transition: none; } }
`;

function el(tag, attrs = {}, kids = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else n.setAttribute(k, v);
  }
  for (const c of kids) n.append(c);
  return n;
}
function svg(tag, attrs = {}) {
  const n = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}

export function mount(root) {
  const style = document.createElement("style");
  style.textContent = CSS;
  root.append(style);

  const note = root.querySelector(".exhibit-note");
  if (note) note.textContent = "Drawn to scale · public fact-sheet figures";

  let part = "rv";
  let warhead = "w87";

  /* ── the drawing ───────────────────────────────────────────────────── */
  const s = svg("svg", {
    class: "mm-svg", viewBox: "0 0 900 210",
    role: "img",
    "aria-label": "Cutaway of a Minuteman III: first stage, second stage, third stage, post-boost system, and the reentry vehicle on the nose.",
  });

  // exhaust, so the thing reads as pointing somewhere
  s.append(svg("ellipse", { class: "mm-shadow", cx: "460", cy: "150", rx: "420", ry: "9" }));
  const flame = svg("path", { class: "mm-flame", d: "M40 84 L -6 105 L 40 126 Z" });
  s.append(flame);

  const partEls = {};
  for (const p of PARTS) {
    const g = svg("g", { class: "mm-part", "data-part": p.id });
    if (p.warheadSlot) {
      const nose = svg("path", { class: "mm-body" });
      g.append(nose);
      partEls[p.id] = { g, nose };
    } else {
      const body = svg("rect", {
        class: "mm-body", x: p.x0, y: 105 - p.r, width: p.x1 - p.x0, height: p.r * 2, rx: 3,
      });
      g.append(body);
      // an interstage seam, so the joints are visible
      const seam = svg("path", {
        class: "mm-seam", d: `M${p.x1} ${105 - p.r}V${105 + p.r}`,
      });
      g.append(seam);
      partEls[p.id] = { g };
    }
    g.addEventListener("pointerenter", () => select(p.id));
    g.addEventListener("click", () => select(p.id));
    s.append(g);
  }

  // scale bar: 18.2 m across 800 px
  const scale = svg("g");
  scale.append(svg("path", { class: "mm-tick", d: "M40 168v10M440 168v10M848 168v10M40 173h808" }));
  const t1 = svg("text", { class: "mm-tick-t", x: "40", y: "194" }); t1.textContent = "0 m";
  const t2 = svg("text", { class: "mm-tick-t", x: "412", y: "194" }); t2.textContent = "9 m";
  const t3 = svg("text", { class: "mm-tick-t", x: "806", y: "194" }); t3.textContent = "18.2 m";
  scale.append(t1, t2, t3);
  s.append(scale);

  /* ── controls ──────────────────────────────────────────────────────── */
  const tabs = el("div", { class: "mm-tabs", role: "group", "aria-label": "Parts of the missile" });
  const tabEls = {};
  for (const p of PARTS) {
    const b = el("button", { type: "button", class: "mm-tab", text: p.label });
    b.addEventListener("click", () => select(p.id));
    tabs.append(b);
    tabEls[p.id] = b;
  }

  const whWrap = el("div", { class: "mm-tabs", role: "group", "aria-label": "Warhead on the nose" });
  whWrap.append(el("span", {
    class: "exhibit-note", text: "On the nose:", style: "align-self:center;margin-inline-end:.35rem",
  }));
  const whEls = {};
  for (const [key, w] of Object.entries(WARHEADS)) {
    const b = el("button", { type: "button", class: "mm-wh", text: w.name });
    b.addEventListener("click", () => { warhead = key; select("rv"); });
    whWrap.append(b);
    whEls[key] = b;
  }

  /* ── panel ─────────────────────────────────────────────────────────── */
  const panel = el("div", { class: "mm-panel", "aria-live": "polite" });

  const left = el("div", {}, [s, tabs, whWrap]);
  root.append(el("div", { class: "mm" }, [left, panel]));

  /* ── behaviour ─────────────────────────────────────────────────────── */

  /** The nose is redrawn per warhead: the Mk-12 is a blunter, shorter body and
   *  the Mk-21 a longer, sharper one, which is a real difference and not a
   *  flourish. */
  function drawNose() {
    const w = WARHEADS[warhead];
    const x0 = 700;
    const tip = x0 + w.nose.len;
    const r = 26;
    const b = w.nose.blunt;
    partEls.rv.nose.setAttribute(
      "d",
      `M${x0} ${105 - r} L${tip - b} ${105 - b} Q${tip} 105 ${tip - b} ${105 + b} L${x0} ${105 + r} Z`,
    );
  }

  function select(id) {
    part = id;
    for (const p of PARTS) {
      partEls[p.id].g.classList.toggle("on", p.id === id);
      tabEls[p.id].setAttribute("aria-pressed", String(p.id === id));
    }
    for (const k of Object.keys(WARHEADS)) {
      whEls[k].setAttribute("aria-pressed", String(k === warhead));
    }
    drawNose();
    render();
  }

  function render() {
    const p = PARTS.find((x) => x.id === part);
    const showWarhead = p.warheadSlot;
    const w = WARHEADS[warhead];

    panel.replaceChildren();
    panel.append(el("h4", { text: showWarhead ? `${w.name} in the ${w.rv}` : p.title }));
    panel.append(el("p", { class: "mm-sub", text: showWarhead ? `${w.yield} · ${w.lab}` : p.sub }));

    const dl = el("dl", { class: "mm-rows" });
    for (const [k, v] of showWarhead ? w.rows : p.rows) {
      dl.append(el("dt", { text: k }), el("dd", { text: v }));
    }
    panel.append(dl);
    panel.append(el("p", { class: "mm-note", text: showWarhead ? w.note : p.note }));

    if (showWarhead) {
      const pips = el("div", { class: "mm-pips" });
      for (let i = 1; i <= 3; i++) {
        pips.append(el("span", { class: `mm-pip${i <= w.safety ? " on" : ""}` }));
      }
      panel.append(el("div", { class: "mm-safety" }, [
        el("div", { class: "mm-safety-l", text: "Modern safety set" }),
        pips,
        el("div", { class: "mm-safety-t", text: SAFETY_MARKS[w.safety - 1] }),
      ]));
    }
  }

  select("rv");
}
