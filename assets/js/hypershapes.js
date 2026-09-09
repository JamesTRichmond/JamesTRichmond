/* ============================================================================
   hypershapes.js — real four-dimensional polytopes, projected down to a screen.

   These are not "4D-looking" decorations. Each shape is a genuine regular
   4-polytope whose vertices live in R⁴. Every frame we rotate the vertex set
   inside two independent 4D planes, then project 4D → 3D → 2D with two
   perspective divides. The turning-inside-out motion is what a double rotation
   in four dimensions actually looks like from in here.

   Three things make them read as objects rather than wireframes:

     · Edges are banded into four depth tiers, each drawn as a single <path>.
       Near tiers are brighter and thicker. Four string writes per shape per
       frame instead of a hundred-odd setAttribute calls — this is the reason
       twenty shapes cost about what five used to.

     · Faces are lit. Each 2-face gets a real 3D normal (cross product of two
       edge vectors taken after the 4D→3D divide), dotted against a fixed light.
       Only fill-opacity is written from JS, so the CSS hue cycle still owns the
       color, and the faces blend additively — no depth sort required.

     · Everything leans away from the cursor, scaled by apparent size, so the
       field has a parallax floor under the text.

   Placement is clamped in CSS rather than JS: each shape's inline start is a
   clamp() that can never let it cross the viewport edge, at any width, with no
   resize listener. That is the fix for shapes being sliced off on narrow
   windows — the old layout anchored a 132px shape at left:88vw and hoped.
   ========================================================================== */

const SVG_NS = "http://www.w3.org/2000/svg";

/* ── Polytopes ─────────────────────────────────────────────────────────────
   Each returns { verts, edges, faces }. Faces are index loops; an empty face
   list means the shape is drawn as pure wireframe.                          */

/** Tesseract (8-cell): 16 vertices at (±1,±1,±1,±1), 32 edges, 24 square
 *  faces. A face fixes two coordinates and walks the other two around a
 *  square, so the winding is (−−) (+−) (++) (−+) — in that order, or the
 *  polygon self-intersects into a bowtie. */
function tesseract() {
  const verts = [];
  for (let i = 0; i < 16; i++) {
    verts.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]);
  }
  const edges = [];
  for (let i = 0; i < 16; i++) {
    for (let bit = 1; bit < 16; bit <<= 1) {
      const j = i ^ bit;
      if (j > i) edges.push([i, j]);
    }
  }
  const faces = [];
  const BITS = [1, 2, 4, 8];
  for (let a = 0; a < 4; a++) {
    for (let b = a + 1; b < 4; b++) {
      const varying = BITS[a] | BITS[b];
      const fixed = 15 & ~varying;
      // every assignment of the two coordinates we are holding still
      for (let base = 0; base < 16; base++) {
        if ((base & varying) !== 0) continue;
        if ((base & fixed) !== base) continue;
        faces.push([base, base | BITS[a], base | varying, base | BITS[b]]);
      }
    }
  }
  return { verts, edges, faces };
}

/** 16-cell: 8 vertices at (±1,0,0,0) and permutations. Every pair is joined
 *  except the four antipodal pairs — 24 edges, 32 triangles. */
function hexadecachoron() {
  const verts = [];
  for (let axis = 0; axis < 4; axis++) {
    for (const sign of [1, -1]) {
      const v = [0, 0, 0, 0];
      v[axis] = sign;
      verts.push(v);
    }
  }
  const edges = [];
  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) if ((i >> 1) !== (j >> 1)) edges.push([i, j]);
  }
  return { verts, edges, faces: trianglesFrom(8, edges) };
}

/** 5-cell (4-simplex): the simplest 4D solid. 5 vertices, 10 edges,
 *  10 triangles — every subset is a face. */
function pentachoron() {
  const s = 1 / Math.sqrt(10);
  const verts = [
    [1, 1, 1, -s * 3],
    [1, -1, -1, -s * 3],
    [-1, 1, -1, -s * 3],
    [-1, -1, 1, -s * 3],
    [0, 0, 0, s * 9],
  ].map((v) => v.map((n) => n * 0.62));
  const edges = [];
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) edges.push([i, j]);
  return { verts, edges, faces: trianglesFrom(5, edges) };
}

/** 24-cell: the one with no three-dimensional analogue. 24 vertices at every
 *  permutation of (±1,±1,0,0), 96 edges between vertices √2 apart, 96
 *  triangles. It is its own dual, and at 96 edges it is dense enough that it
 *  reads as a single glowing object rather than a diagram — so it ships as
 *  wireframe, one to a page. */
function icositetrachoron() {
  const verts = [];
  for (let a = 0; a < 4; a++) {
    for (let b = a + 1; b < 4; b++) {
      for (const sa of [1, -1]) {
        for (const sb of [1, -1]) {
          const v = [0, 0, 0, 0];
          v[a] = sa * 0.72;
          v[b] = sb * 0.72;
          verts.push(v);
        }
      }
    }
  }
  const edges = [];
  const target = 2 * 0.72 * 0.72; // squared edge length
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      let d = 0;
      for (let k = 0; k < 4; k++) {
        const t = verts[i][k] - verts[j][k];
        d += t * t;
      }
      if (Math.abs(d - target) < 1e-6) edges.push([i, j]);
    }
  }
  return { verts, edges, faces: [] };
}

/** Every triple of mutually adjacent vertices. Correct for simplicial
 *  polytopes (the 5-cell, the 16-cell); nonsense for the tesseract, whose
 *  2-faces are squares — which is why that one lists its faces by hand. */
function trianglesFrom(n, edges) {
  const adj = Array.from({ length: n }, () => new Set());
  for (const [a, b] of edges) {
    adj[a].add(b);
    adj[b].add(a);
  }
  const faces = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (!adj[i].has(j)) continue;
      for (let k = j + 1; k < n; k++) {
        if (adj[i].has(k) && adj[j].has(k)) faces.push([i, j, k]);
      }
    }
  }
  return faces;
}

const SHAPES = { tesseract, hexadecachoron, pentachoron, icositetrachoron };

/* ── Projection ──────────────────────────────────────────────────────────── */

const D4 = 3.4; // distance of the 4D camera along W
const D3 = 4.2; // distance of the 3D camera along Z

/** A light fixed in 3D space, up and to the left and slightly toward the
 *  viewer. Faces turned into it glow; faces turned away fall back to ambient. */
const LIGHT = (() => {
  const v = [-0.42, -0.68, 0.6];
  const m = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / m, v[1] / m, v[2] / m];
})();

/**
 * Rotate a 4-vector inside three planes, then project it twice.
 * XW and YZ are a "double rotation": the two planes are completely orthogonal,
 * so neither motion can be mistaken for a 3D tumble. XY is a familiar spin
 * thrown in so the eye has something to hold on to.
 *
 * Returns screen x/y, the intermediate 3D point (which the face lighting needs
 * a real normal from), and a depth scalar where > 1 means nearer the camera.
 */
function project(v, aXW, aYZ, aXY, scale, cx, cy) {
  let [x, y, z, w] = v;

  let c = Math.cos(aXW), s = Math.sin(aXW);
  [x, w] = [x * c - w * s, x * s + w * c];

  c = Math.cos(aYZ); s = Math.sin(aYZ);
  [y, z] = [y * c - z * s, y * s + z * c];

  c = Math.cos(aXY); s = Math.sin(aXY);
  [x, y] = [x * c - y * s, x * s + y * c];

  const k4 = D4 / (D4 - w);
  x *= k4; y *= k4; z *= k4;

  const k3 = D3 / (D3 - z);
  return {
    x: cx + x * k3 * scale,
    y: cy + y * k3 * scale,
    X: x, Y: y, Z: z,          // post-4D, pre-perspective: the lighting space
    depth: k4 * k3,
  };
}

/* ── One shape ───────────────────────────────────────────────────────────── */

const TIERS = 4;

class Hypershape {
  constructor(host, cfg) {
    const { verts, edges, faces } = SHAPES[cfg.kind]();
    this.verts = verts;
    this.edges = edges;
    this.faces = cfg.shaded ? faces : [];
    this.speed = cfg.speed;
    this.rate = cfg.rate;          // per-plane speed multipliers
    this.t = cfg.phase;
    this.depthPull = cfg.depthPull; // how much cursor parallax it takes
    this.ox = 0; this.oy = 0;       // current parallax offset, eased

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute(
      "class",
      `hypershape hypershape-${cfg.kind}` +
        (cfg.shaded ? " featured" : "") +
        (cfg.wander ? " wander" : ""),
    );
    svg.style.inlineSize = `${cfg.size}px`;
    svg.style.blockSize = `${cfg.size}px`;
    svg.style.setProperty("--drift", `${cfg.drift}px`);

    // Center-anchored placement that cannot leave the viewport at any width.
    // The clamp does in CSS what a resize listener would otherwise do in JS.
    const half = cfg.size / 2;
    const edge = 10; // px of breathing room at the viewport boundary
    svg.style.insetInlineStart =
      `clamp(${edge}px, calc(${cfg.cx * 100}% - ${half}px), calc(100% - ${cfg.size + edge}px))`;
    svg.style.insetBlockStart =
      `clamp(${edge}px, calc(${cfg.cy * 100}% - ${half}px), calc(100% - ${cfg.size + edge}px))`;

    // Faces first so the wireframe always sits on top of its own shading.
    this.faceEls = this.faces.map(() => {
      const el = document.createElementNS(SVG_NS, "polygon");
      el.setAttribute("class", "hyperface");
      svg.appendChild(el);
      return el;
    });

    this.tierEls = [];
    for (let i = 0; i < TIERS; i++) {
      const p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("class", `hyperedge tier-${i}`);
      svg.appendChild(p);
      this.tierEls.push(p);
    }

    host.appendChild(svg);
    this.svg = svg;
    this.projected = verts.map(() => null);
  }

  update(dt, px, py) {
    this.t += dt * this.speed;
    const a = this.t;
    const P = this.projected;
    for (let i = 0; i < this.verts.length; i++) {
      P[i] = project(
        this.verts[i],
        a * this.rate[0],
        a * this.rate[1],
        a * this.rate[2],
        26, 50, 50,
      );
    }

    /* Edges, banded by depth into four single-path tiers. */
    const buf = ["", "", "", ""];
    for (let i = 0; i < this.edges.length; i++) {
      const [ai, bi] = this.edges[i];
      const p = P[ai], q = P[bi];
      const near = (p.depth + q.depth) * 0.5;
      // depth runs roughly 0.55 … 1.9; map that onto the four tiers
      let tier = Math.floor((near - 0.6) * 3.1);
      tier = tier < 0 ? 0 : tier > 3 ? 3 : tier;
      buf[tier] +=
        `M${p.x.toFixed(1)} ${p.y.toFixed(1)}L${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
    }
    for (let i = 0; i < TIERS; i++) this.tierEls[i].setAttribute("d", buf[i]);

    /* Faces, lit by a real normal. */
    for (let i = 0; i < this.faces.length; i++) {
      const f = this.faces[i];
      const el = this.faceEls[i];
      const p0 = P[f[0]], p1 = P[f[1]], p2 = P[f[2]];

      // Two edge vectors in the intermediate 3D space, then their cross
      // product. This is the face's actual orientation, not a depth proxy.
      const ux = p1.X - p0.X, uy = p1.Y - p0.Y, uz = p1.Z - p0.Z;
      const vx = p2.X - p0.X, vy = p2.Y - p0.Y, vz = p2.Z - p0.Z;
      let nx = uy * vz - uz * vy;
      let ny = uz * vx - ux * vz;
      let nz = ux * vy - uy * vx;
      const nm = Math.hypot(nx, ny, nz);

      if (nm < 1e-4) {
        // Edge-on: the polygon has collapsed to a line. Hide it rather than
        // draw a bright sliver, which is what gives cheap 3D away.
        el.setAttribute("fill-opacity", "0");
        continue;
      }
      nx /= nm; ny /= nm; nz /= nm;

      // Two-sided lighting: a 4D rotation turns cells inside out constantly,
      // so a back face is not a mistake to be culled, it is the shape working.
      const lambert = Math.abs(nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);

      // A tesseract shows most of its 24 faces at once. Twenty-four additive
      // layers at any generous opacity sum past white and the whole thing goes
      // to grey putty — so each pane is nearly nothing, and the read comes
      // from how they stack. Depth-weighting keeps the near shell brighter
      // than the far one, which is what stops it looking like a flat blob.
      const near = (p0.depth + p1.depth + p2.depth) / 3;
      const front = Math.min(1, Math.max(0, (near - 0.7) * 0.9));
      const opacity = 0.012 + 0.062 * lambert * lambert * (0.35 + 0.65 * front);

      let pts = "";
      for (let k = 0; k < f.length; k++) {
        const p = P[f[k]];
        pts += `${p.x.toFixed(1)},${p.y.toFixed(1)} `;
      }
      el.setAttribute("points", pts);
      el.setAttribute("fill-opacity", opacity.toFixed(3));
    }

    /* Cursor parallax. Eased, so a fast mouse does not snap the field. */
    const tx = px * this.depthPull;
    const ty = py * this.depthPull;
    this.ox += (tx - this.ox) * Math.min(1, dt * 3.4);
    this.oy += (ty - this.oy) * Math.min(1, dt * 3.4);
    this.svg.style.transform = `translate(${this.ox.toFixed(2)}px, ${this.oy.toFixed(2)}px)`;
  }
}

/* ── The field ───────────────────────────────────────────────────────────── */

/** Deterministic PRNG, so a page's field is the same on every visit but two
 *  different pages get two different skies. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

/** The population of one sky, largest first so the featured shapes get the
 *  best slots. `shaded` shapes carry lit faces; the rest are wireframe. */
const POPULATION = [
  { kind: "icositetrachoron", size: 190, shaded: false, band: "gutter" },
  { kind: "tesseract",        size: 148, shaded: true,  band: "gutter" },
  { kind: "tesseract",        size: 122, shaded: true,  band: "gutter" },
  { kind: "hexadecachoron",   size: 116, shaded: true,  band: "gutter" },
  { kind: "tesseract",        size:  96, shaded: false, band: "gutter" },
  { kind: "hexadecachoron",   size:  88, shaded: false, band: "gutter" },
  { kind: "pentachoron",      size:  82, shaded: true,  band: "gutter" },
  { kind: "tesseract",        size:  56, shaded: false, band: "any" },
  { kind: "pentachoron",      size:  70, shaded: false, band: "gutter" },
  { kind: "hexadecachoron",   size:  50, shaded: false, band: "any" },
  { kind: "pentachoron",      size:  62, shaded: false, band: "gutter" },
  { kind: "pentachoron",      size:  46, shaded: false, band: "any" },
  { kind: "hexadecachoron",   size:  54, shaded: false, band: "gutter" },
  { kind: "pentachoron",      size:  42, shaded: false, band: "any" },
  { kind: "tesseract",        size:  48, shaded: false, band: "gutter" },
  { kind: "pentachoron",      size:  34, shaded: false, band: "any" },
  { kind: "hexadecachoron",   size:  42, shaded: false, band: "gutter" },
  { kind: "pentachoron",      size:  34, shaded: false, band: "any" },
];

/**
 * Lay the population out on a jittered grid. Shapes marked "gutter" are kept
 * out of the middle third, where the text column lives; "any" shapes may drift
 * across it, small and faint, so the field does not look like two stripes.
 */
function layout(seed) {
  const rand = rng(seed);
  const cols = 8;
  const rows = 7;
  const taken = new Set();
  const out = [];

  for (let i = 0; i < POPULATION.length; i++) {
    const item = POPULATION[i];
    // Eight columns, not six: the outer quarter on each side is the only part
    // of a wide viewport the text column never reaches, and that is where the
    // big shapes belong. The middle is left to small, faint wanderers.
    const band = item.band === "gutter" ? [0, 1, 6, 7] : [2, 3, 4, 5];

    // find a free cell, giving up gracefully rather than looping forever
    let col = band[(rand() * band.length) | 0];
    let row = (rand() * rows) | 0;
    for (let tries = 0; tries < 40 && taken.has(`${col}:${row}`); tries++) {
      col = band[(rand() * band.length) | 0];
      row = (rand() * rows) | 0;
    }
    taken.add(`${col}:${row}`);
    // Big neighbours crowd each other, so a featured shape also reserves the
    // cells above and below it.
    if (item.size > 100) { taken.add(`${col}:${row - 1}`); taken.add(`${col}:${row + 1}`); }

    out.push({
      kind: item.kind,
      size: item.size,
      shaded: item.shaded,
      wander: item.band !== "gutter",
      cx: (col + 0.14 + rand() * 0.72) / cols,
      cy: (row + 0.14 + rand() * 0.72) / rows,
      speed: 0.3 + rand() * 0.4,
      rate: [1, 0.52 + rand() * 0.3, 0.16 + rand() * 0.2],
      phase: rand() * Math.PI * 2,
      drift: 60 + rand() * 190,
      // Bigger reads as nearer, so it should take more parallax. The sign is
      // negative: the field leans away from the cursor, which is what makes it
      // feel like it is behind the page rather than stuck to it.
      depthPull: -(4 + (item.size / 190) * 16),
    });
  }
  return out;
}

/**
 * @param {Element} host  the fixed, full-viewport container
 * @param {object}  [opts]
 * @param {number}  [opts.seed]  changes the sky; give each page its own
 */
export function mountHypershapes(host, opts = {}) {
  const seed = opts.seed ?? 0x5eed;

  // One shared gradient in user space — a per-element objectBoundingBox
  // gradient collapses on perfectly horizontal or vertical geometry.
  const defsSvg = document.createElementNS(SVG_NS, "svg");
  defsSvg.setAttribute("aria-hidden", "true");
  defsSvg.setAttribute("width", "0");
  defsSvg.setAttribute("height", "0");
  defsSvg.style.position = "absolute";
  defsSvg.innerHTML = `
    <defs>
      <linearGradient id="iriStroke" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0" class="shape-a"></stop>
        <stop offset="1" class="shape-b"></stop>
      </linearGradient>
      <linearGradient id="iriFace" gradientUnits="userSpaceOnUse" x1="0" y1="100" x2="100" y2="0">
        <stop offset="0" class="shape-a"></stop>
        <stop offset="1" class="shape-b"></stop>
      </linearGradient>
    </defs>`;
  host.appendChild(defsSvg);

  const shapes = layout(seed).map((cfg) => new Hypershape(host, cfg));

  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  // Pointer is read on the window, not the host: the host is pointer-events
  // none, and we want the lean to follow the cursor anywhere on the page.
  let px = 0, py = 0;
  const onMove = (e) => {
    px = (e.clientX / innerWidth) * 2 - 1;
    py = (e.clientY / innerHeight) * 2 - 1;
  };
  addEventListener("pointermove", onMove, { passive: true });

  return {
    update(dt) {
      // Held still under reduced motion, but still drawn and still shaded, so
      // the geometry is not lost — only the animation is.
      const step = reduced.matches ? 0 : dt;
      const lean = reduced.matches ? 0 : 1;
      for (const s of shapes) s.update(step, px * lean, py * lean);
    },
    /** Draw one frame regardless of motion preference (for the first paint). */
    prime() {
      for (const s of shapes) s.update(0, 0, 0);
    },
    destroy() {
      removeEventListener("pointermove", onMove);
    },
  };
}
