/* ============================================================================
   measure_hypershapes.mjs — find the largest radius each polytope's projection
   can ever reach, so hypershapes.js can size its coordinate system to fit.

       node scripts/measure_hypershapes.mjs

   Run this after changing a polytope, D4, or D3, and copy the printed values
   into the `maxR` field each shape function returns. If the numbers here are
   larger than the ones in the source, shapes are being clipped by their own
   SVG viewport — a hard square edge across the geometry, which is what this
   whole mechanism exists to prevent.

   Why sampling and not calculus: the quantity being maximised is
   |(x, y)| · k4 · k3 under a two-parameter rotation, where k4 and k3 are
   perspective divides that depend on w and z. It has no pleasant closed form,
   and the answer is a handful of constants that change roughly never, so a
   brute-force sweep run by hand at authoring time is the cheaper instrument.

   Why two angles and not three: the XY rotation mixes x and y but preserves
   x² + y², and neither divide reads x or y — so the projected radius does not
   depend on it. That is a 180× reduction in the search, and it is exact.
   ========================================================================== */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, "..", "assets", "js", "hypershapes.js");

// The module does not export its polytope table (nothing else needs it), so
// import a copy with one line appended rather than widening the public surface.
const src = readFileSync(SRC, "utf8") + "\nexport { SHAPES as __POLYTOPES };\n";
const mod = await import(
  "data:text/javascript;base64," + Buffer.from(src).toString("base64")
);

const D4 = 3.4;
const D3 = 4.2;
const N = Number(process.argv[2] || 256);

function maxRadius(verts) {
  let max = 0;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    for (let j = 0; j < N; j++) {
      const b = (j / N) * Math.PI * 2;
      const cb = Math.cos(b), sb = Math.sin(b);
      for (const v of verts) {
        let [x, y, z, w] = v;
        [x, w] = [x * ca - w * sa, x * sa + w * ca];
        [y, z] = [y * cb - z * sb, y * sb + z * cb];
        const k4 = D4 / (D4 - w);
        const k3 = D3 / (D3 - z * k4);
        const r = Math.hypot(x * k4, y * k4) * k3;
        if (r > max) max = r;
      }
    }
  }
  return max;
}

console.log(`sampling ${N}×${N} rotations per polytope\n`);
console.log("kind                verts  edges  faces   measured   declared   verdict");

let bad = 0;
for (const [kind, build] of Object.entries(mod.__POLYTOPES)) {
  const { verts, edges, faces, maxR } = build();
  const measured = maxRadius(verts);
  // Round up to two decimals: the declared value must never understate the
  // real bound, or the geometry clips.
  const want = Math.ceil(measured * 100) / 100;
  const ok = maxR >= measured;
  if (!ok) bad++;
  console.log(
    kind.padEnd(19),
    String(verts.length).padStart(4),
    String(edges.length).padStart(6),
    String(faces.length).padStart(6),
    "  " + measured.toFixed(4).padStart(8),
    "  " + String(maxR).padStart(8),
    "  " + (ok ? "ok" : `TOO SMALL — set maxR: ${want}`),
  );
}

console.log(
  bad
    ? `\n${bad} polytope(s) will be clipped by their own viewBox. Update hypershapes.js.`
    : "\nEvery polytope fits inside its box.",
);
process.exit(bad ? 1 : 0);
