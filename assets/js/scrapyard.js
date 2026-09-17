/* Loose hardware stays in stage coordinates; the live rig keeps its joints. */
const NS = "http://www.w3.org/2000/svg";
const SCALE = 1.3;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const group = (markup = "") => {
  const el = document.createElementNS(NS, "g");
  el.innerHTML = markup;
  return el;
};

const SCRAPS = [
  {
    name: "tin", type: "head", x: 760, y: 269, radius: 29,
    art: `<path d="M-24-18L22-20 25 20-23 22Z" fill="var(--chassis-hi)"/>
      <path d="M-21-14l43-2M-21 15l43-1M-18-10v20M18-11v20" fill="none" stroke-width=".8"/>
      <ellipse cy="-19" rx="23" ry="5" fill="var(--chassis)"/>
      <path d="M-13-3l7 2m12-2 7-2M-8 9l16-1" fill="none" stroke-width="2"/>
      <path d="M-26-1c-19-8-15 22 2 13" fill="none"/>`,
  },
  {
    name: "spring", type: "arm", x: 850, y: 270, radius: 26,
    art: `<path d="M0-24v5c-26 0 26 10 0 10s26 10 0 10 26 10 0 10v9" fill="none" stroke-width="3"/>
      <path d="M0 19l-10 5 5 9 7-8 7 6 5-8z" fill="var(--chassis-hi)"/>`,
  },
  {
    name: "wheel", type: "leg", x: 950, y: 270, radius: 27,
    art: `<circle r="21" fill="var(--chassis)"/><circle r="17" fill="var(--bg-deep)"/>
      <path d="M-16-3l32 6M-3 16l6-32M-13-12l26 24M-12 13l24-26" fill="none" stroke-width="1"/>
      <circle r="4" fill="var(--accent)"/><path d="M-20-11q-7 13 1 22" fill="none" stroke-width="3"/>`,
  },
];

export class Scrapyard {
  constructor(robot, layer, onChange) {
    this.robot = robot;
    this.onChange = onChange;
    this.layer = group();
    layer.append(this.layer);
    this.pieces = [];
    this.fitted = new Set();
    this.broken = false;
    this.serial = 0;
    this.slots = [
      { key: "body", node: robot.el.root.querySelector(".chassis"), x: 0, y: -78, offset: -28, type: "body", radius: 34 },
      { key: "head", node: robot.el.head, x: 0, y: -129, offset: -25, type: "head", radius: 38 },
      { key: "armB", node: robot.el.armB, x: -31, y: -72, offset: 24, type: "arm", radius: 28 },
      { key: "legB", node: robot.el.legB, x: -11, y: -26, offset: 24, type: "leg", radius: 28 },
      { key: "legF", node: robot.el.legF, x: 11, y: -26, offset: 24, type: "leg", radius: 28 },
      { key: "armF", node: robot.el.armF, x: 31, y: -72, offset: 24, type: "arm", radius: 28 },
    ];
    for (const slot of this.slots) {
      slot.factory = group();
      slot.factory.append(...slot.node.childNodes);
      slot.custom = group();
      slot.custom.setAttribute("transform", `translate(0 ${slot.offset})`);
      slot.node.append(slot.factory, slot.custom);
    }
    this.stock();
    this.notify();
  }

  stock() {
    for (const scrap of SCRAPS) {
      this.addPiece({ ...scrap, el: group(scrap.art), vx: 0, vy: 0, angle: 0, spin: 0, shelf: true });
    }
  }

  addPiece(piece) {
    piece.id = String(++this.serial);
    const wrapper = group();
    wrapper.classList.add("loose-part");
    wrapper.dataset.piece = piece.id;
    const hit = document.createElementNS(NS, "circle");
    hit.setAttribute("r", piece.radius + 10);
    hit.setAttribute("class", "part-hit");
    wrapper.append(hit, piece.el);
    const title = document.createElementNS(NS, "title");
    title.textContent = `${piece.name || piece.key} — drag onto the matching repair outline`;
    wrapper.append(title);
    piece.el = wrapper;
    this.layer.append(wrapper);
    this.pieces.push(piece);
    this.draw(piece);
    return piece;
  }

  notify() {
    this.onChange?.({
      broken: this.broken,
      count: this.broken ? this.fitted.size : 6,
      custom: this.slots.filter(s => s.scrap).length,
    });
  }

  burst() {
    if (this.broken) return;
    const r = this.robot;
    this.broken = true;
    this.fitted.clear();
    this.clearPieces();
    this.stock();
    this.anchor = { x: 550, y: 432 };
    this.outline = group();
    this.outline.classList.add("repair-outline");
    this.layer.prepend(this.outline);
    for (const [i, slot] of this.slots.entries()) {
      const art = group();
      art.append(slot.factory.cloneNode(true), slot.custom.cloneNode(true));
      art.setAttribute("transform", `scale(${SCALE}) translate(0 ${-slot.offset})`);
      this.addPiece({
        key: slot.key, type: slot.type, el: art, radius: slot.radius,
        x: clamp(r.x + slot.x * SCALE, 45, 1155),
        y: clamp(r.y + slot.y * SCALE, 45, 390),
        vx: r.vx * .35 + (i % 2 ? 1 : -1) * (170 + i * 43),
        vy: -280 - i * 48, angle: i * 17,
        spin: r.reduced.matches ? 0 : (i % 2 ? 1 : -1) * (150 + i * 29),
      });
      slot.preview = group();
      const shape = slot.factory.cloneNode(true);
      shape.style.display = "";
      slot.preview.append(shape);
      slot.preview.setAttribute("transform",
        `translate(${this.anchor.x + slot.x * SCALE} ${this.anchor.y + slot.y * SCALE}) scale(${SCALE}) translate(0 ${-slot.offset})`);
      slot.preview.classList.add("repair-socket");
      slot.preview.dataset.slot = slot.key;
      this.outline.append(slot.preview);
    }
    const note = document.createElementNS(NS, "text");
    note.textContent = "REASSEMBLE HERE ↓";
    note.setAttribute("x", "438"); note.setAttribute("y", "190");
    note.setAttribute("font-size", "16"); note.setAttribute("stroke", "none");
    note.setAttribute("fill", "var(--ink-dim)");
    this.outline.append(note);
    r.el.root.style.display = "none";
    r.el.shadow.style.display = "none";
    r.armed = false;
    r.setState("broken");
    this.message("Loose screws! Drag parts onto the outline, or try a room remix.");
    if (!r.reduced.matches) {
      this.word = document.createElementNS(NS, "text");
      this.word.classList.add("impact-word");
      this.word.textContent = ["CLANK!", "KRRSH!", "SPARE PARTS!"][Math.floor(Math.random() * 3)];
      this.word.setAttribute("x", clamp(r.x - 90, 30, 870));
      this.word.setAttribute("y", clamp(r.y - 180, 75, 220));
      this.layer.append(this.word);
      this.wordLife = 1.2;
    }
    r.vx = 0; r.vy = 0;
    this.notify();
  }

  message(text) { if (this.robot.statusEl) this.robot.statusEl.textContent = text; }

  grab(id, pt) {
    const piece = this.pieces.find(p => p.id === id);
    if (!piece) return false;
    if (!this.broken) {
      this.message("Bench scraps are replacement parts. Break him first!");
      return false;
    }
    this.held = piece;
    piece.shelf = false;
    piece.off = { x: piece.x - pt.x, y: piece.y - pt.y };
    piece.vx = 0; piece.vy = 0;
    this.layer.append(piece.el);
    return true;
  }

  move(pt) {
    if (!this.held) return;
    const p = this.held;
    p.x = clamp(pt.x + p.off.x, p.radius, 1200 - p.radius);
    p.y = clamp(pt.y + p.off.y, p.radius, 432 - p.radius);
    p.angle = 0;
    const target = this.target(p);
    for (const s of this.slots) s.preview?.setAttribute("data-ready", String(s === target));
    this.draw(p);
  }

  target(piece) {
    return this.slots.filter(s => !this.fitted.has(s.key) &&
      (piece.key ? piece.key === s.key : piece.type === s.type))
      .map(slot => ({ slot, d: Math.hypot(piece.x - this.anchor.x - slot.x * SCALE, piece.y - this.anchor.y - slot.y * SCALE) }))
      .sort((a, b) => a.d - b.d).find(s => s.d < 78)?.slot;
  }

  release(cancel = false) {
    if (!this.held) return;
    const piece = this.held;
    this.held = null;
    for (const s of this.slots) s.preview?.removeAttribute("data-ready");
    const slot = !cancel && this.target(piece);
    if (slot) this.fit(piece, slot);
  }

  fit(piece, slot) {
    if (piece.name) {
      slot.scrap = piece.name;
      slot.factory.style.display = "none";
      slot.custom.innerHTML = SCRAPS.find(s => s.name === piece.name).art;
    }
    slot.preview.replaceChildren(slot.factory.cloneNode(true), slot.custom.cloneNode(true));
    slot.preview.dataset.filled = "true";
    this.fitted.add(slot.key);
    piece.el.remove();
    this.pieces = this.pieces.filter(p => p !== piece);
    this.message(`${this.fitted.size} / 6 fitted. ${piece.name ? "Questionable engineering. Excellent choice." : "Click. A perfect fit."}`);
    this.notify();
    if (this.fitted.size === 6) this.finish();
  }

  rebuild(remix = false) {
    if (!this.broken) return;
    this.release(true);
    for (const slot of this.slots) {
      if (this.fitted.has(slot.key)) continue;
      const piece = (remix && this.pieces.find(p => p.name && p.type === slot.type)) ||
        this.pieces.find(p => p.key === slot.key);
      if (piece) this.fit(piece, slot);
    }
  }

  finish() {
    this.broken = false;
    this.outline?.remove();
    this.word?.remove();
    this.word = null;
    this.clearPieces();
    this.stock();
    const r = this.robot;
    r.el.root.style.display = "";
    r.el.shadow.style.display = "";
    r.x = this.anchor.x;
    r.face = 1; r.grounded = true; r.armed = false;
    r.goHome();
    r.greet();
    this.message(this.slots.some(s => s.scrap) ? "Rebuilt differently. Still very much himself." : "Back in one piece. For now.");
    this.notify();
  }

  reset() {
    this.held = null;
    this.broken = false;
    this.outline?.remove();
    this.word?.remove();
    this.word = null;
    for (const slot of this.slots) {
      slot.scrap = null;
      slot.factory.style.display = "";
      slot.custom.replaceChildren();
      slot.preview = null;
    }
    this.clearPieces();
    this.stock();
    const r = this.robot;
    r.el.root.style.display = ""; r.el.shadow.style.display = "";
    r.x = 552; r.face = 1; r.grounded = true; r.armed = false;
    r.goHome();
    this.notify();
  }

  clearPieces() {
    this.held = null;
    for (const p of this.pieces) p.el.remove();
    this.pieces.length = 0;
  }

  draw(p) {
    p.el.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.angle.toFixed(1)})`);
  }

  update(dt) {
    this.layer.style.display = this.robot.scene === "workshop" ? "" : "none";
    if (this.word) {
      this.wordLife -= dt;
      this.word.setAttribute("opacity", Math.max(0, this.wordLife));
      if (this.wordLife <= 0) { this.word.remove(); this.word = null; }
    }
    // Fixed-size substeps avoid tunneling through the workbench on slow frames.
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const step = dt / steps;
    for (const p of this.pieces) {
      if (p === this.held || p.shelf) continue;
      for (let i = 0; i < steps; i++) {
        const oldY = p.y;
        p.vy += 1500 * step;
        p.x += p.vx * step; p.y += p.vy * step;
        p.angle += p.spin * step;
        if (p.x < p.radius || p.x > 1200 - p.radius) {
          p.x = clamp(p.x, p.radius, 1200 - p.radius); p.vx *= -.48;
        }
        if (p.y < p.radius) { p.y = p.radius; p.vy = Math.abs(p.vy) * .4; }
        let floor = 432;
        for (const box of SCENE_SOLIDS) {
          if (p.x + p.radius > box.x && p.x - p.radius < box.x + box.w &&
              oldY + p.radius <= box.y + 1 && p.y + p.radius >= box.y) floor = Math.min(floor, box.y);
        }
        if (p.y + p.radius >= floor) {
          p.y = floor - p.radius;
          p.vy = p.vy > 75 ? -p.vy * .38 : 0;
          p.vx *= Math.pow(.06, step); p.spin *= Math.pow(.02, step);
        }
      }
      this.draw(p);
    }
  }
}

export const SCENE_SOLIDS = [
  { x: 700, y: 300, w: 330, h: 18 },
  { x: 60, y: 352, w: 86, h: 80 },
  { x: 150, y: 382, w: 60, h: 50 },
  { x: 440, y: 172, w: 60, h: 28 },
];
