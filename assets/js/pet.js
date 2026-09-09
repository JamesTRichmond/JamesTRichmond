/* ============================================================================
   pet.js — a small robot with a nervous system.

   Nothing here is a keyframed sprite. The robot is a jointed SVG rig — two
   segments per limb, so knees and elbows actually bend — and every frame a
   state machine writes joint angles into a pose object which is then applied
   to the DOM. The motion comes out of simple physics: gravity and ground
   contact for the body, a damped spring for the antenna so it lags going into
   a move and overshoots coming out, squash-and-stretch on landing, and a pupil
   that chases the cursor. Those four things are most of what makes a shape
   feel like it's alive rather than being moved around.

   Free states (idle / walk / air / drag) run physics. Activities take over the
   transform and script it, which keeps each one self-contained: adding a new
   one is a pose function and a mark to stand on.
   ========================================================================== */

import { SCENES, PROPS } from "./scenes.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const DEG = 180 / Math.PI;

const GRAVITY = 2100;      // px/s²
const WALK_SPEED = 175;    // px/s
const JUMP_V = -760;       // px/s
const BOREDOM = 11;        // seconds alone before he goes and finds something to do

const clamp = (n, lo, hi) => (n < lo ? lo : n > hi ? hi : n);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/* Joint pivots, rig-local, feet at the origin. The rig is authored at a
   comfortable size and then scaled once on the way to the stage, so every
   rig-space offset that has to be reasoned about in stage units goes through
   `up()` rather than being hand-converted in ten places. */
const HIP_Y = -50, HIP_X = 11;
const SHOULDER_Y = -96, SHOULDER_X = 31;
const NECK_Y = -104;
const THIGH = 22, UPPER_ARM = 22;
const RIG_SCALE = 1.3;
const up = (n) => n * RIG_SCALE;

/* ── The rig ───────────────────────────────────────────────────────────── */

const limb = (cls, seg1, seg2, tone, tone2) => `
  <g class="${cls}">
    <rect x="${-seg1.w / 2}" y="0" width="${seg1.w}" height="${seg1.len + 4}" rx="${seg1.w / 2}" fill="${tone}"/>
    <g class="${cls}-lo">
      <rect x="${-seg2.w / 2}" y="0" width="${seg2.w}" height="${seg2.len}" rx="${seg2.w / 2}" fill="${tone}"/>
      ${seg2.foot
        ? `<rect x="-9" y="${seg2.len - 5}" width="25" height="12" rx="5.5" fill="${tone2}"/>`
        : `<circle cy="${seg2.len}" r="7.5" fill="${tone2}"/>`}
    </g>
  </g>`;

const RIG = `
<ellipse class="pet-shadow" rx="42" ry="8" fill="#000" opacity=".3"/>
<g class="pet-root">
  <!-- far-side limbs, behind and darker, which is what reads as depth -->
  <g class="limb-b" opacity=".68">
    ${limb("leg-b", { w: 17, len: THIGH }, { w: 15, len: 24, foot: true }, "var(--chassis-lo)", "var(--chassis-lo)")}
    ${limb("arm-b", { w: 13, len: UPPER_ARM }, { w: 11, len: 20 }, "var(--chassis-lo)", "var(--chassis-lo)")}
  </g>

  <g class="pet-body">
    <!-- torso -->
    <rect x="-24" y="-56" width="48" height="58" rx="15" fill="var(--chassis)"/>
    <rect x="-24" y="-56" width="48" height="20" rx="15" fill="var(--chassis-hi)" opacity=".5"/>
    <rect x="-15" y="-43" width="30" height="28" rx="9" fill="var(--chassis-lo)" opacity=".9"/>
    <circle class="pet-core" cx="0" cy="-29" r="8.5" fill="var(--iri-p)"/>
    <circle cx="0" cy="-29" r="19" fill="url(#coreGrad)" opacity=".6"/>
    <rect x="-18" y="-9" width="36" height="7" rx="3.5" fill="var(--accent)" opacity=".9"/>
    <!-- shoulder caps, so the arms read as attached -->
    <circle cx="-25" cy="-48" r="9" fill="var(--chassis-lo)"/>
    <circle cx="25" cy="-48" r="9" fill="var(--chassis)"/>

    <!-- head -->
    <g class="head">
      <rect x="-26" y="-48" width="52" height="49" rx="15" fill="var(--chassis)"/>
      <rect x="-26" y="-48" width="52" height="17" rx="15" fill="var(--chassis-hi)" opacity=".45"/>
      <rect x="-19" y="-36" width="38" height="18" rx="9" fill="var(--bg-deep)"/>
      <rect class="visor" x="-17" y="-34.5" width="34" height="15" rx="7.5" fill="url(#visorGrad)"/>
      <rect class="pupil" x="-5" y="-32" width="10" height="10" rx="5" fill="var(--bg-deep)" opacity=".85"/>
      <rect class="lid" x="-19" y="0" width="38" height="18" rx="9" fill="var(--chassis)"/>
      <rect x="-9" y="-11" width="18" height="5" rx="2.5" fill="var(--chassis-lo)" opacity=".8"/>
      <g class="antenna">
        <path d="M0 0 v-20" stroke="var(--chassis-hi)" stroke-width="4.5" stroke-linecap="round"/>
        <circle class="antenna-tip" cy="-26" r="6.5" fill="var(--accent)"/>
      </g>
    </g>
  </g>

  <!-- near-side limbs -->
  <g class="limb-f">
    ${limb("leg-f", { w: 17, len: THIGH }, { w: 15, len: 24, foot: true }, "var(--chassis)", "var(--chassis-lo)")}
    ${limb("arm-f", { w: 13, len: UPPER_ARM }, { w: 11, len: 20 }, "var(--chassis)", "var(--chassis-hi)")}
  </g>
</g>`;

/* ── Activities ────────────────────────────────────────────────────────── */

const ACTIVITIES = {
  sleep: {
    scene: "workshop", mark: 434, duration: 17,
    status: "sleeping",
    pose(p, t) {
      // Rotating -90° about the feet lays him out head-left along the floor,
      // so the origin sits a torso-half above the mat and his head lands on
      // the pillow up(152) to the left of it.
      p.lean = -90;
      p.x = 434;
      p.y = p.groundY - up(23);
      p.noShadow = true;

      const breath = Math.sin(t * 1.05);
      p.legF = -7 + breath * 2; p.kneeF = 10;
      p.legB = -16 + breath * 2; p.kneeB = 15;
      // arms resting at his sides — with the rig rotated -90°, 0° runs from
      // his shoulders toward his feet, so these are small angles, not large ones
      p.armF = -20 + breath * 3; p.elbowF = 14;
      p.armB = -9; p.elbowB = 9;
      p.headR = -14;
      p.bob = breath * 0.8;
      p.visorOpen = 0.06;
      p.coreDim = 0.35 + Math.sin(t * 1.05) * 0.25;
      p.lookAt(p.x - 60, p.y);

      if (t % 2.6 < 0.02) p.fx.emit("zzz", p.x - up(140), p.y - up(30));
    },
  },

  cook: {
    scene: "kitchen", mark: 492, duration: 19,
    status: "cooking",
    pose(p, t) {
      p.x = 492; p.face = 1;   // up(52) further on puts the pan over the burner
      const cycle = (t % 3.4) / 3.4;
      const tossing = cycle > 0.52 && cycle < 0.76;
      const swing = tossing ? Math.sin((cycle - 0.52) / 0.24 * Math.PI) : 0;
      const idle = Math.sin(t * 1.5);

      p.armF = -74 - swing * 34; p.elbowF = 46 - swing * 30;
      p.armB = 14 + idle * 5;    p.elbowB = 26;
      p.legF = 3; p.kneeF = 4;
      p.legB = -7; p.kneeB = 8;
      p.bob = idle * 1.5 - swing * 3;
      p.headR = -7 - swing * 5;
      p.lookAt(p.x + 80, p.groundY - up(104));

      // the pan tracks the hand, then whips over on the toss
      p.prop("pan", {
        x: p.x + up(52) + swing * 10,
        y: p.groundY - up(84) - swing * 24,
        r: -12 - swing * 155,
        s: RIG_SCALE,
      });
      p.sceneEl("burner")?.setAttribute("opacity", (0.5 + Math.sin(t * 9) * 0.22).toFixed(2));

      if (tossing && Math.random() < 0.45) {
        p.fx.emit("bit", p.x + up(56), p.groundY - up(104), { vx: rand(-26, 34), vy: rand(-250, -170) });
      }
      if (Math.random() < 0.06) p.fx.emit("steam", p.x + up(52) + rand(-16, 16), p.groundY - up(94));
    },
  },

  ride: {
    scene: "road", mark: 300, duration: 17,
    status: "riding",
    pose(p, t) {
      const cruise = Math.min(1, t / 2);
      const bikeX = lerp(-140, 720, easeOut(Math.min(1, t / 8))) + Math.sin(t * 0.55) * 28;
      const bump = Math.sin(t * 12) * 1.7 * cruise;

      p.prop("bike", { x: bikeX, y: p.groundY - up(30) + bump, s: RIG_SCALE });
      p.spinWheels(t * 9 * cruise);
      p.noShadow = true;

      // seated: hips over the seat, feet forward on the pegs, hands on the bars
      // his hips have to land on the seat, and the hips sit `up(-HIP_Y)`
      // above the rig origin, so the origin goes below the seat by that much
      p.x = bikeX + 4;
      p.y = p.groundY - up(30) - up(34) + up(-HIP_Y) + bump;
      p.face = 1;
      p.lean = -12 - cruise * 5;
      p.legF = -60; p.kneeF = 75;
      p.legB = -52; p.kneeB = 82;
      p.armF = -95; p.elbowF = 14;
      p.armB = -88; p.elbowB = 12;
      p.headR = 12;
      p.bob = 0;
      p.lookAt(p.x + 240, p.y - 140);

      // the dashed centerline scrolling is what actually sells the speed
      const line = p.sceneEl("roadline");
      if (line) line.setAttribute("stroke-dashoffset", (-t * 560 * cruise).toFixed(1));

      if (Math.random() < 0.4 * cruise) {
        p.fx.emit("puff", bikeX - 70, p.groundY - 22, { vx: rand(-80, -34), vy: rand(-36, -8) });
      }
    },
  },

  climb: {
    scene: "mountain", mark: 470, duration: 17,
    status: "climbing",
    pose(p, t) {
      const reach = Math.sin(t * 2.1);
      const side = reach > 0 ? 1 : -1;

      p.x = 604;
      p.y = 322 + reach * 7;
      p.face = 1;
      p.lean = 5;
      p.noShadow = true;

      // opposite limbs reach together, the way anything with four of them climbs
      // ~180° reaches straight up; a small elbow keeps the forearm going the
      // same way instead of folding back behind his head
      p.armF = 170 + side * 20; p.elbowF = 16 + side * 10;
      p.armB = 170 - side * 20; p.elbowB = 16 - side * 10;
      p.legF = -12 - side * 15; p.kneeF = 38 + side * 14;
      p.legB = -12 + side * 15; p.kneeB = 38 - side * 14;
      p.headR = -10 + reach * 4;
      p.bob = 0;
      p.lookAt(p.x + 30, p.y - 240);

      // the wall slides past him instead of him leaving the frame
      const wall = p.sceneEl("rockwall");
      if (wall) wall.setAttribute("transform", `translate(0 ${((t * 64) % 220).toFixed(1)})`);

      if (Math.random() < 0.07) {
        p.fx.emit("chip", p.x - 26, p.y + 34, { vx: rand(-46, -12), vy: rand(-70, 10) });
      }
    },
  },

  service: {
    scene: "workshop", mark: 640, duration: 19,
    status: "changing the oil",
    pose(p, t) {
      const bikeX = 640;
      p.prop("bike", { x: bikeX, y: p.groundY - up(122), s: RIG_SCALE });  // up on the jack
      p.prop("jack", { x: bikeX, y: p.groundY, s: RIG_SCALE });
      p.prop("oilpan", { x: bikeX - 104, y: p.groundY - 14, s: 1.15 });
      p.spinWheels(0);

      // flat on his back, head under the engine, one arm working a wrench
      p.lean = -90;
      p.x = bikeX + up(86);
      p.y = p.groundY - up(23);
      p.face = 1;
      p.noShadow = true;

      // -90° is straight up once he's on his back, which is where the bike is
      const turn = Math.sin(t * 3.6);
      p.armF = -86 + turn * 20; p.elbowF = 28 - turn * 14;
      p.armB = -14; p.elbowB = 11;
      p.legF = -9; p.kneeF = 13;
      p.legB = -19; p.kneeB = 17;
      p.headR = 12;
      p.bob = 0;
      p.lookAt(p.x - 90, p.y - 40);

      const fill = clamp((t - 2) / 12, 0, 1);
      p.propEl("oilpan")?.querySelector(".oil-level")?.setAttribute("opacity", (fill * 0.95).toFixed(2));
      if (t > 2 && t < 14.5 && Math.random() < 0.2) p.fx.emit("drip", bikeX - 104, p.groundY - up(88));
    },
  },
};

/* ── Particle effects ──────────────────────────────────────────────────── */

class Fx {
  constructor(layer) { this.layer = layer; this.items = []; }

  emit(kind, x, y, opts = {}) {
    if (this.items.length > 70) return;
    let el;
    const spec = { life: 0, x, y, vx: opts.vx ?? 0, vy: opts.vy ?? -40, kind };

    switch (kind) {
      case "zzz":
        el = document.createElementNS(SVG_NS, "text");
        el.textContent = "z";
        el.setAttribute("font-size", "28");
        el.setAttribute("font-family", "IBM Plex Mono, monospace");
        el.setAttribute("fill", "var(--accent)");
        spec.ttl = 3.0; spec.vy = -32; spec.vx = rand(8, 22);
        break;
      case "steam":
        el = circle(rand(5, 10), "var(--ink)");
        spec.ttl = 1.5; spec.vy = rand(-50, -28); spec.vx = rand(-12, 12);
        break;
      case "puff":
        el = circle(rand(5, 12), "var(--ink-dim)");
        spec.ttl = 1.1;
        break;
      case "drip":
        el = circle(3.4, "var(--iri-p)");
        spec.ttl = 1.4; spec.vy = 70; spec.grav = 520;
        break;
      case "chip":
        el = circle(2.8, "var(--ink-dim)");
        spec.ttl = 0.9; spec.grav = 900;
        break;
      case "bit":
        el = document.createElementNS(SVG_NS, "rect");
        el.setAttribute("width", "10"); el.setAttribute("height", "10");
        el.setAttribute("rx", "3.5"); el.setAttribute("x", "-5"); el.setAttribute("y", "-5");
        el.setAttribute("fill", "var(--accent)");
        spec.ttl = 1.35; spec.grav = 700;
        break;
      case "spark":
        el = circle(3.2, "var(--fluoro)");
        spec.ttl = 0.8; spec.vx = rand(-110, 110); spec.vy = rand(-170, -60); spec.grav = 560;
        break;
      default: return;
    }

    spec.el = el;
    spec.grav ??= 0;
    this.layer.appendChild(el);
    this.items.push(spec);
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.life += dt;
      if (p.life >= p.ttl) { p.el.remove(); this.items.splice(i, 1); continue; }
      p.vy += p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const k = 1 - p.life / p.ttl;
      p.el.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      p.el.setAttribute("opacity", (k * 0.9).toFixed(2));
    }
  }

  clear() {
    for (const p of this.items) p.el.remove();
    this.items.length = 0;
  }
}

function circle(r, fill) {
  const el = document.createElementNS(SVG_NS, "circle");
  el.setAttribute("r", r);
  el.setAttribute("fill", fill);
  return el;
}

/* ── The robot ─────────────────────────────────────────────────────────── */

class Pet {
  constructor({ sceneLayer, fxLayer, petLayer, fgLayer, statusEl, onStateChange }) {
    this.onStateChange = onStateChange;
    this.statusEl = statusEl;

    // Each scene gets up to three bands: art behind him, `mid` just behind him
    // but in front of the wall, and `fg` in front of him so he can stand behind
    // a kitchen counter the way a person would.
    this.sceneGroups = {};
    this.fgGroups = {};
    const band = (host, markup, name) => {
      const g = document.createElementNS(SVG_NS, "g");
      g.innerHTML = markup ?? "";
      g.style.transition = "opacity .45s ease";
      g.style.opacity = name === "workshop" ? "1" : "0";
      host.appendChild(g);
      return g;
    };
    for (const [name, def] of Object.entries(SCENES)) {
      this.sceneGroups[name] = band(sceneLayer, (def.art ?? "") + (def.mid ?? ""), name);
      this.fgGroups[name] = band(fgLayer, def.fg, name);
    }

    const props = document.createElementNS(SVG_NS, "g");
    props.innerHTML = PROPS;
    sceneLayer.appendChild(props);
    this.propsRoot = props;

    this.fx = new Fx(fxLayer);

    const rig = document.createElementNS(SVG_NS, "g");
    rig.innerHTML = RIG;
    petLayer.appendChild(rig);

    const q = (s) => rig.querySelector(s);
    this.el = {
      root: q(".pet-root"), body: q(".pet-body"), head: q(".head"),
      antenna: q(".antenna"), pupil: q(".pupil"), lid: q(".lid"),
      core: q(".pet-core"), shadow: q(".pet-shadow"),
      legF: q(".leg-f"), legFlo: q(".leg-f-lo"),
      legB: q(".leg-b"), legBlo: q(".leg-b-lo"),
      armF: q(".arm-f"), armFlo: q(".arm-f-lo"),
      armB: q(".arm-b"), armBlo: q(".arm-b-lo"),
    };

    this.scene = "workshop";
    this.groundY = SCENES.workshop.groundY;

    this.x = 552; this.y = this.groundY;
    this.vx = 0; this.vy = 0;
    this.face = 1;
    this.grounded = true;

    this.antAngle = 0; this.antVel = 0;
    this.squash = 0; this.phase = 0;
    this.blinkIn = rand(2, 5); this.blink = 0;
    this.look = { x: 600, y: 240, px: 0, py: 0 };

    this.stateT = 0; this.idleT = 0;
    this.target = null; this.after = null;
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)");

    this.pose = {};
    this.setState("idle");
  }

  /* -- helpers the activity pose functions lean on -- */
  sceneEl(cls) { return this.sceneGroups[this.scene].querySelector(`.${cls}`); }
  propEl(name) { return this.propsRoot.querySelector(`.prop-${name}`); }

  prop(name, { x = 0, y = 0, r = 0, s = 1, opacity = 1 }) {
    const el = this.propEl(name);
    if (!el) return;
    el.setAttribute("transform",
      `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.toFixed(1)}) scale(${s})`);
    el.setAttribute("opacity", opacity);
  }

  hideProps() {
    for (const el of this.propsRoot.querySelectorAll(".prop")) el.setAttribute("opacity", "0");
  }

  spinWheels(a) {
    const bike = this.propEl("bike");
    if (!bike) return;
    const [b, f] = bike.querySelectorAll(".bike-wheel");
    const deg = ((a * DEG) % 360).toFixed(1);
    b?.setAttribute("transform", `translate(-58 0) rotate(${deg})`);
    f?.setAttribute("transform", `translate(58 0) rotate(${deg})`);
  }

  lookAt(x, y) { this.look.x = x; this.look.y = y; }

  /* -- state control -- */
  setState(name, opts = {}) {
    this.state = name;
    this.stateT = 0;
    this.activity = ACTIVITIES[name] || null;
    this.hideProps();               // every activity re-shows exactly what it needs
    if (opts.after !== undefined) this.after = opts.after;

    const label = this.activity?.status
      ?? { idle: "idle", walk: "walking", air: "airborne", drag: "held",
           greet: "saying hi", travel: "on his way" }[name] ?? name;
    if (this.statusEl) this.statusEl.textContent = label;
    this.onStateChange?.(name);
  }

  setScene(name) {
    if (name === this.scene) return;
    this.sceneGroups[this.scene].style.opacity = "0";
    this.fgGroups[this.scene].style.opacity = "0";
    this.sceneGroups[name].style.opacity = "1";
    this.fgGroups[name].style.opacity = "1";
    this.scene = name;
    this.groundY = SCENES[name].groundY;
    this.fx.clear();
  }

  /** Send him off to do something. He walks to his mark first. */
  startActivity(name) {
    const act = ACTIVITIES[name];
    if (!act) return this.goHome();
    this.setScene(act.scene);
    this.y = this.groundY;
    this.target = act.mark;
    this.setState("travel", { after: name });
  }

  goHome() {
    this.setScene("workshop");
    this.y = this.groundY;
    this.vx = 0; this.vy = 0;
    this.setState("idle");
  }

  /* -- input -- */
  handleInput(input) {
    this.idleT = 0;
    if (this.activity || this.state === "travel") {
      if (input.dir || input.jump) this.goHome();
      else return;
    }
    if (this.state === "drag") return;

    if (input.dir) {
      this.vx = input.dir * WALK_SPEED;
      this.face = input.dir;
      if (this.grounded && this.state !== "walk") this.setState("walk");
    }
    if (input.jump && this.grounded) {
      this.vy = JUMP_V;
      this.grounded = false;
      this.setState("air");
    }
  }

  grab(x, y) {
    if (this.activity) this.goHome();
    this.setState("drag");
    this.dragOff = { x: this.x - x, y: this.y - y };
    this.vx = 0; this.vy = 0;
    this.idleT = 0;
  }

  dragTo(x, y) {
    if (this.state !== "drag") return;
    const nx = clamp(x + this.dragOff.x, 46, 1154);
    const ny = clamp(y + this.dragOff.y, 60, this.groundY);
    this.vx = (nx - this.x) * 9;
    this.vy = (ny - this.y) * 9;
    this.x = nx; this.y = ny;
  }

  release() {
    if (this.state !== "drag") return;
    this.vx = clamp(this.vx, -950, 950);
    this.vy = clamp(this.vy, -1200, 800);
    this.grounded = false;
    this.setState("air");
  }

  greet() {
    this.idleT = 0;
    if (this.activity) this.goHome();
    this.setState("greet");
    for (let i = 0; i < 9; i++) this.fx.emit("spark", this.x + rand(-20, 20), this.y - up(140));
  }

  walkTo(x) {
    if (this.activity) this.goHome();
    if (this.state === "drag") return;
    this.target = clamp(x, 60, 1140);
    this.setState("travel", { after: "idle" });
  }

  /* -- per-frame -- */
  update(dt, input) {
    this.stateT += dt;
    this.idleT += dt;

    if (this.state === "travel") {
      const d = this.target - this.x;
      if (Math.abs(d) < 9) {
        this.vx = 0;
        const next = this.after;
        this.after = null;
        this.setState(next && next !== "idle" ? next : "idle");
      } else {
        this.face = Math.sign(d);
        this.vx = this.face * WALK_SPEED;
      }
    }

    const scripted = Boolean(this.activity);
    if (!scripted && this.state !== "drag") this.integrate(dt);
    if (this.state === "drag") this.grounded = false;

    // walk phase advances with real speed, so his feet never skate
    this.phase += (Math.abs(this.vx) / 28) * dt * Math.PI;

    this.blinkIn -= dt;
    if (this.blinkIn <= 0) { this.blink = 0.16; this.blinkIn = rand(2.4, 6.5); }
    if (this.blink > 0) this.blink -= dt;

    // reset the pose, then let whichever state owns this frame write into it
    const p = this.pose;
    p.bob = 0; p.lean = 0; p.headR = 0;
    p.armF = 0; p.armB = 0; p.legF = 0; p.legB = 0;
    p.elbowF = 0; p.elbowB = 0; p.kneeF = 0; p.kneeB = 0;
    p.visorOpen = 1; p.coreDim = 1; p.noShadow = false;
    p.x = this.x; p.y = this.y; p.face = this.face;
    p.groundY = this.groundY;
    p.fx = this.fx;
    p.prop = this.prop.bind(this);
    p.propEl = this.propEl.bind(this);
    p.sceneEl = this.sceneEl.bind(this);
    p.spinWheels = this.spinWheels.bind(this);
    p.lookAt = this.lookAt.bind(this);

    if (this.activity) {
      this.activity.pose(p, this.stateT);
      this.x = p.x; this.y = p.y; this.face = p.face;
      if (this.stateT > this.activity.duration) this.goHome();
    } else {
      this.poseFree(p, this.stateT);
    }

    this.springs(dt, p);
    this.apply(p);
    this.fx.update(dt);

    if (!this.reduced.matches && this.state === "idle" && this.idleT > BOREDOM) {
      this.idleT = 0;
      this.startActivity(pick(Object.keys(ACTIVITIES)));
    }
  }

  integrate(dt) {
    this.vy += GRAVITY * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x < 46) { this.x = 46; this.vx = Math.abs(this.vx) * 0.4; }
    if (this.x > 1154) { this.x = 1154; this.vx = -Math.abs(this.vx) * 0.4; }

    if (this.y >= this.groundY) {
      if (!this.grounded && this.vy > 300) {
        this.squash = clamp(this.vy / 1500, 0, 0.55);
        for (let i = 0; i < 3; i++) this.fx.emit("puff", this.x + rand(-18, 18), this.groundY - 4);
      }
      this.y = this.groundY;
      this.vy = 0;
      if (!this.grounded) {
        this.grounded = true;
        if (this.state === "air") this.setState(Math.abs(this.vx) > 24 ? "walk" : "idle");
      }
      if (this.state !== "travel" && this.state !== "walk") this.vx *= 0.8;
    } else {
      this.grounded = false;
      if (this.state !== "air") this.setState("air");
    }
  }

  poseFree(p, t) {
    switch (this.state) {
      case "walk":
      case "travel": {
        const sw = Math.sin(this.phase);
        p.legF = sw * 30;
        p.legB = -sw * 30;
        // knees only bend on the recovery swing, never backwards
        p.kneeF = Math.max(0, -Math.sin(this.phase + 0.7)) * 52;
        p.kneeB = Math.max(0, -Math.sin(this.phase + 0.7 + Math.PI)) * 52;
        p.armF = -sw * 24; p.elbowF = 18 + Math.max(0, sw) * 22;
        p.armB = sw * 24;  p.elbowB = 18 + Math.max(0, -sw) * 22;
        p.bob = -Math.abs(sw) * 3;
        p.lean = 4;
        p.headR = -2;
        break;
      }
      case "air": {
        const up = this.vy < 0;
        p.legF = up ? -30 : 16; p.kneeF = up ? 62 : 22;
        p.legB = up ? -16 : 28; p.kneeB = up ? 48 : 14;
        p.armF = up ? -132 : -62; p.elbowF = up ? 34 : 16;
        p.armB = up ? -142 : -48; p.elbowB = up ? 28 : 12;
        p.lean = up ? -6 : 6;
        p.headR = up ? -6 : 5;
        break;
      }
      case "drag": {
        // gravity still owns the limbs even when the body isn't falling
        p.legF = 10; p.kneeF = 10; p.legB = -8; p.kneeB = 14;
        p.armF = 166; p.elbowF = 12; p.armB = 172; p.elbowB = 8;
        p.lean = clamp(-this.vx * 0.018, -18, 18);
        p.headR = clamp(this.vx * 0.01, -9, 9);
        break;
      }
      case "greet": {
        const w = Math.sin(t * 12);
        p.armF = -152 + w * 24; p.elbowF = 26 + w * 18;
        p.armB = 12; p.elbowB = 20;
        p.bob = -Math.abs(Math.sin(t * 6)) * 3;
        p.headR = -5;
        if (t > 1.5) this.setState("idle");
        break;
      }
      default: {
        // idle: a slow breath and the occasional glance. Nothing else.
        const br = Math.sin(t * 1.5);
        p.bob = br * 1.4;
        p.armF = 6 + br * 3; p.elbowF = 12;
        p.armB = -5 - br * 3; p.elbowB = 10;
        p.legF = 2; p.legB = -2;
        p.headR = Math.sin(t * 0.6) * 3;
      }
    }
  }

  springs(dt, p) {
    // Antenna: a damped spring chasing a target derived from body motion. This
    // is the follow-through that makes the whole rig read as physical.
    const target = clamp(-this.vx * 0.05 - (this.grounded ? 0 : this.vy * 0.018), -48, 48) - p.lean * 0.3;
    const k = 130, damp = 13;
    this.antVel += (target - this.antAngle) * k * dt - this.antVel * damp * dt;
    this.antAngle += this.antVel * dt;

    this.squash = Math.max(0, this.squash - dt * 2.4);

    const dx = this.look.x - (this.x + this.face * 4);
    const dy = this.look.y - (this.y - up(132));
    const m = Math.hypot(dx, dy) || 1;
    const t = 1 - Math.pow(0.001, dt);
    this.look.px = lerp(this.look.px, clamp((dx / m) * 7 * this.face, -7, 7), t);
    this.look.py = lerp(this.look.py, clamp((dy / m) * 3.5, -3.5, 3.5), t);
  }

  apply(p) {
    const sy = 1 - this.squash * 0.34;
    const sx = 1 + this.squash * 0.3;
    const e = this.el;
    const n = (v) => v.toFixed(1);

    e.root.setAttribute("transform",
      `translate(${n(p.x)} ${n(p.y)}) rotate(${n(p.lean)}) ` +
      `scale(${(p.face * sx * RIG_SCALE).toFixed(3)} ${(sy * RIG_SCALE).toFixed(3)})`);

    e.body.setAttribute("transform", `translate(0 ${(HIP_Y + p.bob).toFixed(2)})`);
    e.head.setAttribute("transform", `translate(0 ${NECK_Y - HIP_Y}) rotate(${n(p.headR)})`);
    e.antenna.setAttribute("transform", `translate(0 -48) rotate(${n(this.antAngle)})`);

    e.legF.setAttribute("transform", `translate(${HIP_X} ${HIP_Y}) rotate(${n(p.legF)})`);
    e.legB.setAttribute("transform", `translate(${-HIP_X} ${HIP_Y}) rotate(${n(p.legB)})`);
    e.legFlo.setAttribute("transform", `translate(0 ${THIGH}) rotate(${n(p.kneeF)})`);
    e.legBlo.setAttribute("transform", `translate(0 ${THIGH}) rotate(${n(p.kneeB)})`);

    // The limb groups are siblings of the body, so their pivots are in
    // rig-absolute coordinates — they only borrow the body's bob.
    const shy = (SHOULDER_Y + p.bob).toFixed(1);
    e.armF.setAttribute("transform", `translate(${SHOULDER_X} ${shy}) rotate(${n(p.armF)})`);
    e.armB.setAttribute("transform", `translate(${-SHOULDER_X} ${shy}) rotate(${n(p.armB)})`);
    e.armFlo.setAttribute("transform", `translate(0 ${UPPER_ARM}) rotate(${n(p.elbowF)})`);
    e.armBlo.setAttribute("transform", `translate(0 ${UPPER_ARM}) rotate(${n(p.elbowB)})`);

    // blink and sleep close the same lid
    const open = this.blink > 0 ? 0.05 : p.visorOpen;
    e.lid.setAttribute("transform", `translate(0 -36.5) scale(1 ${(1 - open).toFixed(3)})`);
    e.pupil.setAttribute("transform", `translate(${this.look.px.toFixed(2)} ${this.look.py.toFixed(2)})`);
    e.core.setAttribute("opacity", (0.55 + 0.45 * p.coreDim).toFixed(2));

    // The shadow lives outside the scaled rig, in stage coordinates, so it
    // stays put on the floor while he squashes and rises. Tightening it as he
    // gains height is most of the height cue.
    if (p.noShadow) {
      e.shadow.setAttribute("opacity", "0");
    } else {
      const h = clamp((this.groundY - this.y) / 230, 0, 1);
      const k = (1 - h * 0.5) * sx;
      e.shadow.setAttribute("transform",
        `translate(${n(p.x)} ${(this.groundY + 4).toFixed(1)}) scale(${k.toFixed(3)} ${(1 - h * 0.5).toFixed(3)})`);
      e.shadow.setAttribute("opacity", (0.34 * (1 - h * 0.72)).toFixed(2));
    }
  }
}

/* ── Mounting + input ──────────────────────────────────────────────────── */

export function mountPet(stage, { onStateChange } = {}) {
  const svg = stage.querySelector(".stage-svg");
  const pet = new Pet({
    sceneLayer: svg.querySelector("[data-scene-layer]"),
    fxLayer: svg.querySelector("[data-fx-layer]"),
    petLayer: svg.querySelector("[data-pet-layer]"),
    fgLayer: svg.querySelector("[data-fg-layer]"),
    statusEl: stage.querySelector("[data-stage-status]"),
    onStateChange,
  });

  const keys = new Set();
  const input = { dir: 0, jump: false };

  /** Client point → the SVG's own coordinates. preserveAspectRatio is "slice",
   *  so the viewBox is cropped rather than letterboxed. */
  const toLocal = (evt) => {
    const r = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const scale = Math.max(r.width / vb.width, r.height / vb.height);
    return {
      x: (evt.clientX - r.left - (r.width - vb.width * scale) / 2) / scale,
      y: (evt.clientY - r.top - (r.height - vb.height * scale) / 2) / scale,
    };
  };

  /* Keyboard is scoped to the stage, so arrow keys never steal page scroll. */
  let hovering = false;
  stage.addEventListener("pointerenter", () => { hovering = true; });
  stage.addEventListener("pointerleave", () => { hovering = false; });
  const listening = () => hovering || document.activeElement === stage;

  const WATCHED = ["arrowleft", "arrowright", "arrowup", " ", "a", "d", "w"];
  addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (!listening() || !WATCHED.includes(k)) return;
    e.preventDefault();
    keys.add(k);
  });
  addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
  addEventListener("blur", () => keys.clear());

  /* Pointer: grab him, or send him somewhere. */
  let dragging = false, moved = false, downAt = null;

  stage.addEventListener("pointerdown", (e) => {
    const pt = toLocal(e);
    downAt = pt;
    moved = false;
    if (Math.hypot(pt.x - pet.x, pt.y - (pet.y - up(90))) < up(105)) {
      dragging = true;
      stage.setPointerCapture(e.pointerId);
      pet.grab(pt.x, pt.y);
    }
  });

  stage.addEventListener("pointermove", (e) => {
    const pt = toLocal(e);
    pet.lookAt(pt.x, pt.y);
    if (!dragging) return;
    if (Math.hypot(pt.x - downAt.x, pt.y - downAt.y) > 12) moved = true;
    pet.dragTo(pt.x, pt.y);
  });

  stage.addEventListener("pointerup", (e) => {
    if (dragging) {
      dragging = false;
      if (moved) pet.release();
      else { pet.setState("idle"); pet.greet(); }
    } else if (downAt) {
      pet.walkTo(toLocal(e).x);
    }
    downAt = null;
  });

  stage.addEventListener("pointercancel", () => {
    if (dragging) { dragging = false; pet.release(); }
    downAt = null;
  });

  return {
    update(dt) {
      input.dir = (keys.has("arrowright") || keys.has("d") ? 1 : 0) -
                  (keys.has("arrowleft") || keys.has("a") ? 1 : 0);
      input.jump = keys.has(" ") || keys.has("arrowup") || keys.has("w");
      if (input.dir || input.jump) pet.handleInput(input);
      else if (pet.state === "walk" && pet.grounded) { pet.vx = 0; pet.setState("idle"); }
      pet.update(dt, input);
    },
    command(name) { name === "idle" ? pet.goHome() : pet.startActivity(name); },
    get state() { return pet.state; },
  };
}
