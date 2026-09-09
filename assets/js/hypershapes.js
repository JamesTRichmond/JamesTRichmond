/* ============================================================================
   hypershapes.js — real four-dimensional polytopes, projected down to a screen.

   These are not "4D-looking" decorations. Each shape is a genuine regular
   4-polytope whose vertices live in R⁴. Every frame we rotate the vertex set
   inside two independent 4D planes (XW and YZ), then project 4D → 3D → 2D with
   two perspective divides. The turning-inside-out motion you see is what a
   double rotation in four dimensions actually looks like from in here.
   ========================================================================== */

const TAU = Math.PI * 2;

/* ── Polytope definitions ──────────────────────────────────────────────── */

/** Tesseract (8-cell): 16 vertices at (±1,±1,±1,±1); edges join vertices that
 *  differ in exactly one coordinate. 32 edges. */
function tesseract() {
  const verts = [];
  for (let i = 0; i < 16; i++) {
    verts.push([
      i & 1 ? 1 : -1,
      i & 2 ? 1 : -1,
      i & 4 ? 1 : -1,
      i & 8 ? 1 : -1,
    ]);
  }
  const edges = [];
  for (let i = 0; i < 16; i++) {
    for (let bit = 1; bit < 16; bit <<= 1) {
      const j = i ^ bit;
      if (j > i) edges.push([i, j]);
    }
  }
  return { verts, edges };
}

/** 16-cell: 8 vertices at (±1,0,0,0) and permutations. Every pair is joined
 *  except the four antipodal pairs. 24 edges. */
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
    for (let j = i + 1; j < 8; j++) {
      // antipodal pairs sit on the same axis with opposite signs
      if ((i >> 1) !== (j >> 1)) edges.push([i, j]);
    }
  }
  return { verts, edges };
}

/** 5-cell (4-simplex): the simplest 4D solid. 5 vertices, all pairs joined. */
function pentachoron() {
  const s = 1 / Math.sqrt(10);
  const verts = [
    [ 1,  1,  1, -s * 3],
    [ 1, -1, -1, -s * 3],
    [-1,  1, -1, -s * 3],
    [-1, -1,  1, -s * 3],
    [ 0,  0,  0,  s * 9],
  ].map((v) => v.map((n) => n * 0.62));
  const edges = [];
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) edges.push([i, j]);
  return { verts, edges };
}

const SHAPES = { tesseract, hexadecachoron, pentachoron };

/* ── Projection ────────────────────────────────────────────────────────── */

const D4 = 3.4;   // distance of the 4D camera along W
const D3 = 4.2;   // distance of the 3D camera along Z

/**
 * Rotate a 4-vector inside two independent planes, then project to 2D.
 * Rotating in XW and YZ simultaneously is a "double rotation" — the pair of
 * planes is orthogonal, so neither motion can be mistaken for a 3D tumble.
 */
function project(v, aXW, aYZ, aXY, scale, cx, cy) {
  let [x, y, z, w] = v;

  // plane XW
  let c = Math.cos(aXW), s = Math.sin(aXW);
  [x, w] = [x * c - w * s, x * s + w * c];

  // plane YZ
  c = Math.cos(aYZ); s = Math.sin(aYZ);
  [y, z] = [y * c - z * s, y * s + z * c];

  // plane XY — a familiar rotation, so the eye has something to hold on to
  c = Math.cos(aXY); s = Math.sin(aXY);
  [x, y] = [x * c - y * s, x * s + y * c];

  // 4D → 3D
  const k4 = D4 / (D4 - w);
  x *= k4; y *= k4; z *= k4;

  // 3D → 2D
  const k3 = D3 / (D3 - z);
  return {
    x: cx + x * k3 * scale,
    y: cy + y * k3 * scale,
    depth: k4 * k3, // > 1 means nearer the camera
  };
}

/* ── Rendering ─────────────────────────────────────────────────────────── */

const SVG_NS = "http://www.w3.org/2000/svg";

class Hypershape {
  constructor(host, { kind, size, top, left, speed, drift, phase }) {
    const { verts, edges } = SHAPES[kind]();
    this.verts = verts;
    this.edges = edges;
    this.speed = speed;
    this.t = phase;

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("class", "hypershape");
    svg.style.inlineSize = `${size}px`;
    svg.style.blockSize = `${size}px`;
    svg.style.insetBlockStart = top;
    svg.style.insetInlineStart = left;
    svg.style.setProperty("--drift", `${drift}px`);

    this.lines = edges.map(() => {
      const ln = document.createElementNS(SVG_NS, "line");
      svg.appendChild(ln);
      return ln;
    });

    host.appendChild(svg);
    this.svg = svg;
  }

  update(dt) {
    this.t += dt * this.speed;
    const projected = this.verts.map((v) =>
      project(v, this.t, this.t * 0.61, this.t * 0.24, 26, 50, 50)
    );

    for (let i = 0; i < this.edges.length; i++) {
      const [a, b] = this.edges[i];
      const p = projected[a], q = projected[b];
      const ln = this.lines[i];
      ln.setAttribute("x1", p.x.toFixed(2));
      ln.setAttribute("y1", p.y.toFixed(2));
      ln.setAttribute("x2", q.x.toFixed(2));
      ln.setAttribute("y2", q.y.toFixed(2));
      // Nearer edges read brighter, which is what sells the depth.
      const near = (p.depth + q.depth) * 0.5;
      ln.setAttribute("opacity", Math.min(1, Math.max(0.12, (near - 0.55) * 1.15)).toFixed(2));
    }
  }
}

/* Sparse placement — noticeable, never crowded. */
const LAYOUT = [
  { kind: "tesseract",      size: 132, top: "12dvh", left: "6vw",  speed: 0.42, drift: 120, phase: 0.0 },
  { kind: "pentachoron",    size: 84,  top: "34dvh", left: "88vw", speed: 0.61, drift: 220, phase: 1.7 },
  { kind: "hexadecachoron", size: 104, top: "62dvh", left: "13vw", speed: 0.35, drift: 170, phase: 3.1 },
  { kind: "tesseract",      size: 76,  top: "78dvh", left: "78vw", speed: 0.55, drift: 260, phase: 4.4 },
  { kind: "pentachoron",    size: 62,  top: "88dvh", left: "44vw", speed: 0.48, drift: 90,  phase: 2.2 },
];

export function mountHypershapes(host) {
  // One shared gradient in user space — a per-line objectBoundingBox gradient
  // would collapse on perfectly horizontal or vertical edges.
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
    </defs>`;
  host.appendChild(defsSvg);

  const shapes = LAYOUT.map((cfg) => new Hypershape(host, cfg));

  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  return {
    update(dt) {
      // Still drawn, just held still, so the geometry remains visible.
      const step = reduced.matches ? 0 : dt;
      for (const s of shapes) s.update(step);
    },
    /** Draw one frame regardless of motion preference (for the initial paint). */
    prime() {
      for (const s of shapes) s.update(0);
    },
  };
}
