/* ============================================================================
   subject.js — five more rooms for the robot, one per subject page.

   Each subject page hands the habitat a scene and a single activity, sets
   autonomy off, and lets him get on with it. He is the same robot from the
   home page; only the room and the job change. That is the whole reason the
   engine was pulled out into its own repo — a new room is a template string
   and a pose function, not a new animation system.

   Angles are degrees from hanging straight down: a limb at t points along
   (-sin t, cos t), so 0 is toward the floor, ±180 is straight up, and negative
   angles swing forward. Getting that backwards puts an arm through the ground.
   ========================================================================== */

import { RIG_SCALE, up } from "./rig.js";

const rand = (a, b) => a + Math.random() * (b - a);

/* ── Rooms ───────────────────────────────────────────────────────────────── */

export const SUBJECT_SCENES = {
  /* The maintenance bay. A reentry vehicle on a cradle, a tool stand, a status
     board — the shape of the room a munitions squadron actually works in, not
     a launch console, which is somebody else's job entirely. */
  bay: {
    groundY: 434,
    label: "the bay",
    art: `
      <rect x="0" y="0" width="1200" height="520" fill="var(--hb-bg)"/>
      <rect x="0" y="96" width="1200" height="338" fill="var(--hb-surface)" opacity=".5"/>

      <!-- overhead trusswork -->
      <g stroke="var(--hb-line)" stroke-width="3" fill="none" opacity=".7">
        <path d="M0 108h1200M0 140h1200"/>
        <path d="M40 108l40 32M120 108l40 32M200 108l40 32M280 108l40 32M360 108l40 32
                 M440 108l40 32M520 108l40 32M600 108l40 32M680 108l40 32M760 108l40 32
                 M840 108l40 32M920 108l40 32M1000 108l40 32M1080 108l40 32"/>
      </g>

      <!-- bay lights -->
      <g>
        <rect x="250" y="140" width="120" height="12" rx="4" fill="var(--hb-accent)" opacity=".85"/>
        <rect x="830" y="140" width="120" height="12" rx="4" fill="var(--hb-accent)" opacity=".85"/>
        <path d="M310 152 L 190 434 L 430 434 Z" fill="var(--hb-accent)" opacity=".055"/>
        <path d="M890 152 L 770 434 L 1010 434 Z" fill="var(--hb-accent)" opacity=".055"/>
      </g>

      <!-- status board: a grid of lamps, most of them green -->
      <g>
        <rect x="86" y="188" width="196" height="132" rx="8" fill="var(--hb-raised)" opacity=".9"/>
        <rect x="98" y="200" width="172" height="24" rx="4" fill="var(--hb-bg)" opacity=".8"/>
        <g class="bay-lamps">
          <circle cx="118" cy="252" r="7" fill="var(--hb-visor)"/>
          <circle cx="150" cy="252" r="7" fill="var(--hb-visor)"/>
          <circle cx="182" cy="252" r="7" fill="var(--hb-visor)"/>
          <circle cx="214" cy="252" r="7" fill="var(--hb-accent)"/>
          <circle cx="246" cy="252" r="7" fill="var(--hb-visor)"/>
          <circle cx="118" cy="288" r="7" fill="var(--hb-visor)"/>
          <circle cx="150" cy="288" r="7" fill="var(--hb-visor)"/>
          <circle cx="182" cy="288" r="7" fill="var(--hb-visor)"/>
          <circle cx="214" cy="288" r="7" fill="var(--hb-visor)"/>
          <circle cx="246" cy="288" r="7" fill="var(--hb-visor)"/>
        </g>
      </g>

      <!-- the cradle -->
      <g>
        <rect x="700" y="380" width="300" height="20" rx="6" fill="var(--hb-raised)"/>
        <rect x="726" y="400" width="16" height="34" fill="var(--hb-raised)" opacity=".8"/>
        <rect x="958" y="400" width="16" height="34" fill="var(--hb-raised)" opacity=".8"/>
        <circle cx="742" cy="440" r="10" fill="var(--hb-chassis-lo)"/>
        <circle cx="958" cy="440" r="10" fill="var(--hb-chassis-lo)"/>
      </g>

      <!-- the cone on it: a blunt-nosed reentry body, deliberately generic -->
      <g class="bay-cone">
        <path d="M712 380 L 850 218 Q 856 212 862 218 L 990 380 Z"
              fill="var(--hb-chassis)" opacity=".92"/>
        <path d="M850 218 Q 856 212 862 218 L 990 380 L 900 380 Z"
              fill="var(--hb-chassis-lo)" opacity=".75"/>
        <path d="M736 356h240M764 322h172M792 288h116" stroke="var(--hb-bg)"
              stroke-width="3" opacity=".45"/>
        <circle cx="856" cy="228" r="7" fill="var(--hb-chassis-hi)" opacity=".9"/>
        <!-- the inspection band the scanner sweeps -->
        <rect class="bay-scan" x="712" y="360" width="278" height="4"
              fill="var(--hb-visor)" opacity="0"/>
      </g>

      <!-- tool stand -->
      <g>
        <rect x="430" y="352" width="120" height="12" rx="4" fill="var(--hb-raised)"/>
        <rect x="440" y="364" width="10" height="70" fill="var(--hb-raised)" opacity=".8"/>
        <rect x="530" y="364" width="10" height="70" fill="var(--hb-raised)" opacity=".8"/>
        <rect x="448" y="336" width="30" height="16" rx="3" fill="var(--hb-chassis-lo)"/>
        <rect x="488" y="340" width="20" height="12" rx="2" fill="var(--hb-accent)" opacity=".8"/>
        <rect x="518" y="330" width="8" height="22" rx="3" fill="var(--hb-ink-dim)" opacity=".7"/>
      </g>

      <!-- painted floor line: the boundary you do not cross without a reason -->
      <rect x="640" y="424" width="420" height="5" fill="var(--hb-accent)" opacity=".35"/>
      <rect x="0" y="434" width="1200" height="86" fill="var(--hb-bg)"/>
    `,
  },

  /* The classroom. One board, one timeline, and the light from a window that
     always seems to be late afternoon. */
  classroom: {
    groundY: 434,
    label: "the classroom",
    art: `
      <rect x="0" y="0" width="1200" height="520" fill="var(--hb-bg)"/>
      <rect x="0" y="80" width="1200" height="354" fill="var(--hb-surface)" opacity=".5"/>

      <!-- window, and the slab of light it throws on the floor -->
      <g>
        <rect x="60" y="128" width="180" height="180" rx="6" fill="var(--hb-raised)" opacity=".55"/>
        <path d="M150 128v180M60 218h180" stroke="var(--hb-bg)" stroke-width="6" opacity=".6"/>
        <path d="M240 150 L 470 434 L 250 434 Z" fill="var(--hb-accent)" opacity=".06"/>
      </g>

      <!-- the board -->
      <g>
        <rect x="330" y="116" width="620" height="230" rx="6" fill="var(--hb-bg)" opacity=".85"/>
        <rect x="322" y="108" width="636" height="246" rx="8" fill="none"
              stroke="var(--hb-chassis-lo)" stroke-width="10"/>
        <!-- chalk timeline -->
        <g stroke="var(--hb-ink-dim)" stroke-width="3" fill="none" opacity=".85" stroke-linecap="round">
          <path d="M372 262h544"/>
          <path d="M410 250v24M500 250v24M590 250v24M680 250v24M770 250v24M860 250v24"/>
        </g>
        <g fill="var(--hb-ink-dim)" opacity=".55">
          <rect x="386" y="286" width="46" height="7" rx="3"/>
          <rect x="478" y="286" width="42" height="7" rx="3"/>
          <rect x="566" y="286" width="50" height="7" rx="3"/>
          <rect x="660" y="286" width="38" height="7" rx="3"/>
          <rect x="748" y="286" width="46" height="7" rx="3"/>
          <rect x="840" y="286" width="40" height="7" rx="3"/>
        </g>
        <!-- the heading, chalked in and underlined twice -->
        <g fill="var(--hb-accent)" opacity=".8">
          <rect x="372" y="152" width="180" height="11" rx="5"/>
          <rect x="372" y="172" width="126" height="8" rx="4"/>
        </g>
        <!-- the circled thing on the board, which the pointer lands on -->
        <ellipse class="room-focus" cx="590" cy="262" rx="34" ry="26"
                 fill="none" stroke="var(--hb-accent)" stroke-width="4" opacity="0"/>
      </g>

      <!-- desk -->
      <g>
        <rect x="120" y="352" width="210" height="14" rx="4" fill="var(--hb-raised)"/>
        <rect x="134" y="366" width="12" height="68" fill="var(--hb-raised)" opacity=".8"/>
        <rect x="304" y="366" width="12" height="68" fill="var(--hb-raised)" opacity=".8"/>
        <rect x="148" y="334" width="54" height="18" rx="3" fill="var(--hb-ink-dim)" opacity=".5"/>
        <rect x="152" y="328" width="54" height="8" rx="3" fill="var(--hb-ink-dim)" opacity=".35"/>
        <circle cx="268" cy="342" r="11" fill="var(--hb-glow)" opacity=".75"/>
      </g>

      <rect x="0" y="434" width="1200" height="86" fill="var(--hb-bg)"/>
    `,
  },

  /* The desk. One big monitor, code scrolling on it, and the specific
     late-night quality of a room lit mostly by a screen. */
  terminal: {
    groundY: 434,
    label: "the desk",
    art: `
      <rect x="0" y="0" width="1200" height="520" fill="var(--hb-bg)"/>
      <rect x="0" y="96" width="1200" height="338" fill="var(--hb-surface)" opacity=".42"/>

      <!-- screen glow washing the room -->
      <path d="M700 180 L 1080 180 L 1180 434 L 560 434 Z" fill="var(--hb-visor)" opacity=".05"/>

      <!-- desk -->
      <g>
        <rect x="600" y="356" width="480" height="16" rx="5" fill="var(--hb-raised)"/>
        <rect x="620" y="372" width="14" height="62" fill="var(--hb-raised)" opacity=".8"/>
        <rect x="1046" y="372" width="14" height="62" fill="var(--hb-raised)" opacity=".8"/>
      </g>

      <!-- monitor -->
      <g>
        <rect x="700" y="168" width="330" height="176" rx="10" fill="var(--hb-chassis-lo)"/>
        <rect x="712" y="180" width="306" height="146" rx="5" fill="var(--hb-bg)"/>
        <rect x="846" y="344" width="38" height="12" fill="var(--hb-chassis-lo)"/>
        <rect x="812" y="352" width="106" height="8" rx="4" fill="var(--hb-chassis-lo)"/>
        <!-- code: bars standing in for lines, because real glyphs at this size
             are mush, and the eye reads indentation as code anyway -->
        <g class="term-code" fill="var(--hb-visor)" opacity=".72">
          <rect x="726" y="194" width="96" height="6" rx="3"/>
          <rect x="738" y="208" width="140" height="6" rx="3" opacity=".7"/>
          <rect x="738" y="222" width="112" height="6" rx="3" opacity=".7"/>
          <rect x="750" y="236" width="164" height="6" rx="3" opacity=".55"/>
          <rect x="750" y="250" width="88" height="6" rx="3" opacity=".55"/>
          <rect x="738" y="264" width="132" height="6" rx="3" opacity=".7"/>
          <rect x="726" y="278" width="72" height="6" rx="3"/>
          <rect x="738" y="292" width="150" height="6" rx="3" opacity=".7"/>
        </g>
        <rect class="term-caret" x="898" y="292" width="9" height="10" fill="var(--hb-accent)"/>
        <!-- the pass/fail strip along the bottom of the screen -->
        <rect class="term-bar" x="712" y="312" width="0" height="8" fill="var(--hb-visor)" opacity=".9"/>
      </g>

      <!-- keyboard, mug, and a plant that is doing fine, thank you -->
      <rect class="term-keys" x="742" y="346" width="156" height="10" rx="3" fill="var(--hb-chassis)"/>
      <g>
        <rect x="948" y="332" width="30" height="24" rx="4" fill="var(--hb-accent)" opacity=".85"/>
        <path d="M978 338h10a7 7 0 0 1 0 14h-10" fill="none" stroke="var(--hb-accent)"
              stroke-width="4" opacity=".85"/>
      </g>
      <g opacity=".8">
        <rect x="638" y="330" width="26" height="26" rx="4" fill="var(--hb-chassis-lo)"/>
        <path d="M651 330c-14-6-18-20-10-30 6 10 14 10 18 2 6 12 2 24-8 28z"
              fill="var(--hb-visor)" opacity=".55"/>
      </g>

      <rect x="0" y="434" width="1200" height="86" fill="var(--hb-bg)"/>
    `,
  },

  /* The rack. Somebody else's production, at two in the morning. */
  rack: {
    groundY: 434,
    label: "the rack",
    art: `
      <rect x="0" y="0" width="1200" height="520" fill="var(--hb-bg)"/>
      <rect x="0" y="90" width="1200" height="344" fill="var(--hb-surface)" opacity=".45"/>

      <!-- cold-aisle floor tiles -->
      <g stroke="var(--hb-line)" stroke-width="2" opacity=".35">
        <path d="M0 452h1200M0 480h1200M120 434v86M320 434v86M520 434v86M720 434v86M920 434v86M1120 434v86"/>
      </g>

      <!-- the rack itself -->
      <g>
        <rect x="700" y="130" width="300" height="304" rx="8" fill="var(--hb-raised)" opacity=".9"/>
        <rect x="714" y="144" width="272" height="276" rx="4" fill="var(--hb-bg)" opacity=".85"/>
        <g class="rack-units">
          <rect x="726" y="156" width="248" height="30" rx="3" fill="var(--hb-chassis-lo)"/>
          <rect x="726" y="192" width="248" height="30" rx="3" fill="var(--hb-chassis-lo)"/>
          <rect x="726" y="228" width="248" height="30" rx="3" fill="var(--hb-chassis-lo)"/>
          <rect x="726" y="264" width="248" height="30" rx="3" fill="var(--hb-chassis-lo)"/>
          <rect x="726" y="300" width="248" height="46" rx="3" fill="var(--hb-chassis)"/>
          <rect x="726" y="352" width="248" height="56" rx="3" fill="var(--hb-chassis-lo)"/>
        </g>
        <!-- link lights -->
        <g class="rack-leds" fill="var(--hb-visor)">
          <circle cx="742" cy="171" r="4"/><circle cx="758" cy="171" r="4" opacity=".5"/>
          <circle cx="742" cy="207" r="4"/><circle cx="758" cy="207" r="4" opacity=".5"/>
          <circle cx="742" cy="243" r="4"/><circle cx="758" cy="243" r="4" opacity=".5"/>
          <circle cx="742" cy="279" r="4"/><circle cx="758" cy="279" r="4" opacity=".5"/>
        </g>
        <!-- the appliance in the middle, the one that is always the problem -->
        <g>
          <rect x="742" y="312" width="216" height="22" rx="3" fill="var(--hb-bg)" opacity=".7"/>
          <circle class="rack-alarm" cx="944" cy="323" r="6" fill="var(--hb-accent)"/>
        </g>
        <!-- patch panel: the port he is heading for is marked -->
        <g class="rack-ports" fill="var(--hb-bg)" opacity=".9">
          <rect x="740" y="364" width="18" height="14" rx="2"/><rect x="764" y="364" width="18" height="14" rx="2"/>
          <rect x="788" y="364" width="18" height="14" rx="2"/><rect x="812" y="364" width="18" height="14" rx="2"/>
          <rect x="836" y="364" width="18" height="14" rx="2"/><rect x="860" y="364" width="18" height="14" rx="2"/>
          <rect x="884" y="364" width="18" height="14" rx="2"/><rect x="908" y="364" width="18" height="14" rx="2"/>
        </g>
        <rect class="rack-port-hot" x="836" y="364" width="18" height="14" rx="2"
              fill="var(--hb-visor)" opacity="0"/>
      </g>

      <!-- cable management, doing its best -->
      <g fill="none" stroke="var(--hb-glow)" stroke-width="4" opacity=".5" stroke-linecap="round">
        <path d="M700 386 Q 620 400 600 434"/>
        <path d="M700 372 Q 640 386 628 434"/>
        <path d="M1000 380 Q 1080 396 1096 434"/>
      </g>

      <rect x="0" y="434" width="1200" height="86" fill="var(--hb-bg)"/>
    `,
  },

  /* The loop. Not a room — a diagram he happens to be standing inside. */
  loop: {
    groundY: 434,
    label: "the loop",
    art: `
      <rect x="0" y="0" width="1200" height="520" fill="var(--hb-bg)"/>
      <g stroke="var(--hb-line)" stroke-width="1.5" opacity=".3">
        <path d="M0 180h1200M0 240h1200M0 300h1200M0 360h1200M0 420h1200"/>
        <path d="M120 140v294M300 140v294M480 140v294M660 140v294M840 140v294M1020 140v294"/>
      </g>

      <!-- the three tools, hanging in the air where he can reach them -->
      <g class="loop-links" stroke="var(--hb-glow)" stroke-width="2.5" fill="none" opacity=".45">
        <path d="M300 220 L 600 190 L 900 220"/>
        <path d="M600 190 L 600 280"/>
      </g>

      <g class="loop-node loop-node-a">
        <path d="M300 186l30 17v34l-30 17-30-17v-34z" fill="var(--hb-surface)"
              stroke="var(--hb-glow)" stroke-width="2.5"/>
        <path d="M288 214h24M288 222h16" stroke="var(--hb-ink-dim)" stroke-width="3" stroke-linecap="round"/>
      </g>
      <g class="loop-node loop-node-b">
        <path d="M600 156l30 17v34l-30 17-30-17v-34z" fill="var(--hb-surface)"
              stroke="var(--hb-glow)" stroke-width="2.5"/>
        <circle cx="600" cy="190" r="9" fill="none" stroke="var(--hb-ink-dim)" stroke-width="3"/>
      </g>
      <g class="loop-node loop-node-c">
        <path d="M900 186l30 17v34l-30 17-30-17v-34z" fill="var(--hb-surface)"
              stroke="var(--hb-glow)" stroke-width="2.5"/>
        <path d="M890 220l8 8 14-16" stroke="var(--hb-ink-dim)" stroke-width="3"
              fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </g>

      <!-- the return arc: what makes it a loop rather than a pipeline -->
      <path class="loop-arc" d="M900 254 Q 600 400 300 254" fill="none"
            stroke="var(--hb-accent)" stroke-width="3" opacity=".35"
            stroke-dasharray="10 12"/>

      <rect x="0" y="434" width="1200" height="86" fill="var(--hb-bg)" opacity=".85"/>
    `,
  },
};

/* ── Jobs ────────────────────────────────────────────────────────────────── */

/** A slow four-count breath, so a standing pose is never actually still. */
const breathe = (t) => Math.sin(t * 1.15);

export const SUBJECT_ACTIVITIES = {
  /* Walks the length of the cone with a scanner, from the base to the nose and
     back. The green band on the cone tracks his hand, which is the whole gag:
     the scan line is not decoration, it is where he is pointing. */
  inspect: {
    scene: "bay", mark: 620, duration: 9999,
    status: "on the cone",
    pose(p, t) {
      const sweep = (Math.sin(t * 0.34) + 1) / 2;      // 0 at the base, 1 at the nose
      const b = breathe(t);

      p.x = 596 + sweep * 96;
      p.face = 1;
      p.bob = b * 1.2;
      // reaching higher the closer he gets to the nose
      p.armF = -96 - sweep * 58; p.elbowF = 40 - sweep * 26;
      p.armB = 15 + b * 4; p.elbowB = 22;
      p.legF = 4; p.kneeF = 5;
      p.legB = -6; p.kneeB = 7;
      p.headR = -6 - sweep * 8;

      const handY = p.groundY - up(96) - sweep * up(58);
      p.lookAt(p.x + 120, handY - 20);

      const scan = p.sceneEl("bay-scan");
      if (scan) {
        // The band narrows as it rides up the cone, because the cone does.
        const y = 366 - sweep * 128;
        const w = 274 - sweep * 196;
        scan.setAttribute("y", y.toFixed(0));
        scan.setAttribute("x", (851 - w / 2).toFixed(0));
        scan.setAttribute("width", w.toFixed(0));
        scan.setAttribute("opacity", (0.35 + Math.sin(t * 6) * 0.12).toFixed(2));
      }
      if (Math.random() < 0.02) p.fx.emit("spark", p.x + up(70), handY);
    },
  },

  /* Points at the board, sweeps along the timeline, then turns back to the
     room to see whether any of it landed. */
  teach: {
    scene: "classroom", mark: 300, duration: 9999,
    status: "at the board",
    pose(p, t) {
      const cycle = t % 11;
      const turning = cycle > 7.4;                      // facing the class
      const along = (Math.sin(t * 0.42) + 1) / 2;       // where on the timeline
      const b = breathe(t);

      p.x = 470 + along * 150;
      p.face = turning ? -1 : 1;
      p.bob = b * 1.3;
      p.legF = 3; p.kneeF = 5;
      p.legB = -6; p.kneeB = 8;

      if (turning) {
        // hands open, the universal shape of "so what does that tell us"
        const g = Math.sin((cycle - 7.4) * 1.6);
        p.armF = -52 - g * 16; p.elbowF = 52 + g * 10;
        p.armB = -40 + g * 14; p.elbowB = 48;
        p.headR = 3;
        p.lookAt(p.x - 260, p.groundY - up(150));
      } else {
        p.armF = -142 - along * 12; p.elbowF = 18;
        p.armB = 16 + b * 5; p.elbowB = 20;
        p.headR = -14;
        p.lookAt(590, 262);
      }

      const focus = p.sceneEl("room-focus");
      if (focus) {
        focus.setAttribute("cx", (410 + along * 452).toFixed(0));
        focus.setAttribute("opacity", turning ? "0.75" : (0.3 + along * 0.4).toFixed(2));
      }
    },
  },

  /* Types. Every so often he stops, leans back, and looks at the ceiling for
     an answer, which is the most accurate thing in this entire project. */
  code: {
    scene: "terminal", mark: 660, duration: 9999,
    status: "shipping",
    pose(p, t) {
      const cycle = t % 14;
      const thinking = cycle > 9.6 && cycle < 12.4;
      const b = breathe(t);

      p.x = 672;
      p.face = 1;

      if (thinking) {
        const k = (cycle - 9.6) / 2.8;
        p.lean = -6;
        p.armF = 26; p.elbowF = 18;
        p.armB = 22; p.elbowB = 14;
        p.headR = 16;
        p.bob = b * 1.1;
        p.lookAt(p.x + 40, 120);
        p.coreDim = 0.5 + Math.sin(t * 3) * 0.4;
        if (k > 0.86) p.fx.emit("bit", p.x + up(20), p.groundY - up(190));
      } else {
        // two hands alternating on the keys, half a beat apart
        const key = Math.sin(t * 11);
        p.lean = 4;
        p.armF = -66 + key * 7; p.elbowF = 58 - key * 6;
        p.armB = -58 - key * 7; p.elbowB = 54 + key * 6;
        p.headR = -12;
        p.bob = b * 0.8 + Math.abs(key) * 0.5;
        p.lookAt(860, 250);
      }

      p.legF = 3; p.kneeF = 5;
      p.legB = -6; p.kneeB = 7;

      const caret = p.sceneEl("term-caret");
      if (caret) caret.setAttribute("opacity", (t * 2) % 1 < 0.5 ? "1" : "0.05");
      const bar = p.sceneEl("term-bar");
      if (bar) {
        // the test suite filling up, then resetting, forever
        const fill = thinking ? 0 : ((cycle % 4.8) / 4.8) * 306;
        bar.setAttribute("width", fill.toFixed(0));
      }
      const keys = p.sceneEl("term-keys");
      if (keys) keys.setAttribute("opacity", thinking ? "0.7" : "1");
    },
  },

  /* Traces a cable, finds the port, seats it. The alarm lamp goes green when
     the plug lands, then goes amber again a moment later, which is honest. */
  patch: {
    scene: "rack", mark: 600, duration: 9999,
    status: "tracing it",
    pose(p, t) {
      const cycle = t % 9;
      const seating = cycle > 4.6 && cycle < 6.2;
      const seated = cycle > 6.2 && cycle < 7.8;
      const b = breathe(t);

      p.x = 620 + Math.sin(t * 0.5) * 22;
      p.face = 1;
      p.bob = b * 1.2;
      p.legF = 4; p.kneeF = 6;
      p.legB = -7; p.kneeB = 8;

      // scanning the panel, then reaching in for the port
      const reach = seating || seated ? 1 : Math.max(0, Math.sin(cycle * 0.7));
      p.armF = -84 - reach * 44; p.elbowF = 46 - reach * 24;
      p.armB = 14 + b * 4; p.elbowB = 20;
      p.headR = -8 - reach * 6;
      p.lookAt(846, 372);

      const hot = p.sceneEl("rack-port-hot");
      if (hot) hot.setAttribute("opacity", seated ? "0.95" : seating ? "0.4" : "0");
      const alarm = p.sceneEl("rack-alarm");
      if (alarm) {
        alarm.setAttribute("fill", seated ? "var(--hb-visor)" : "var(--hb-accent)");
        alarm.setAttribute("opacity", seated ? "1" : (0.5 + Math.sin(t * 5) * 0.4).toFixed(2));
      }
      const leds = p.sceneEl("rack-leds");
      if (leds) leds.setAttribute("opacity", (0.7 + Math.sin(t * 7) * 0.3).toFixed(2));

      if (seating && Math.random() < 0.2) p.fx.emit("spark", 846, 372);
    },
  },

  /* Runs the loop by hand: reaches up, taps a tool, waits for it to come back,
     taps the next. The node he is on lights; the others wait their turn. */
  dispatch: {
    scene: "loop", mark: 600, duration: 9999,
    status: "in the loop",
    pose(p, t) {
      const NODES = [300, 600, 900];
      const step = Math.floor(t / 3.2) % 3;
      const phase = (t / 3.2) % 1;
      const target = NODES[step];
      const b = breathe(t);

      // he walks to whichever tool he is about to call
      p.x = target + Math.sin(t * 0.8) * 10;
      p.face = 1;
      p.bob = b * 1.4;
      p.legF = 4; p.kneeF = 6;
      p.legB = -7; p.kneeB = 9;

      // the tap: up on the beat, back down after
      const tap = phase < 0.42 ? Math.sin((phase / 0.42) * Math.PI) : 0;
      p.armF = -70 - tap * 100; p.elbowF = 40 - tap * 34;
      p.armB = 16 + b * 5; p.elbowB = 18;
      p.headR = -10 - tap * 8;
      p.lookAt(target, 200);
      p.coreDim = 0.7 + tap * 0.3;

      for (let i = 0; i < 3; i++) {
        const el = p.sceneEl(`loop-node-${"abc"[i]}`);
        if (!el) continue;
        const live = i === step ? 0.55 + tap * 0.45 : 0.3;
        el.setAttribute("opacity", live.toFixed(2));
      }
      const arc = p.sceneEl("loop-arc");
      if (arc) arc.setAttribute("stroke-dashoffset", ((-t * 34) % 22).toFixed(1));

      if (tap > 0.85 && Math.random() < 0.3) {
        p.fx.emit("bit", target, 250, { vx: rand(-40, 40), vy: rand(-160, -90) });
      }
    },
  },
};

/* ── Which room belongs to which page ────────────────────────────────────── */

export const DOCENTS = {
  usaf:       { scene: "bay",       activity: "inspect",  caption: "He is checking the seams. He will be a while." },
  teacher:    { scene: "classroom", activity: "teach",    caption: "Ask him what caused the war. He will not tell you; he will make you say it." },
  agents:     { scene: "loop",      activity: "dispatch", caption: "Call a tool, read what came back, decide again. That is the whole trick." },
  security:   { scene: "rack",      activity: "patch",    caption: "Somebody's production, two in the morning." },
  python:     { scene: "terminal",  activity: "code",     caption: "The pause is him thinking. It is the most accurate part of this animation." },
  typescript: { scene: "terminal",  activity: "code",     caption: "Green bar. Then he changes something, and it is not a green bar." },
};

/** Everything a subject page needs to hand createHabitat(). */
export function docentOptions(subject) {
  const d = DOCENTS[subject];
  if (!d) return null;
  return {
    scenes: SUBJECT_SCENES,
    activities: SUBJECT_ACTIVITIES,
    scene: d.scene,
    // He has one job on these pages. Autonomy would have him wander off to
    // cook, into a kitchen that does not exist here.
    autonomy: false,
    status: true,
    keyboard: false,
    caption: d.caption,
    start: d.activity,
  };
}

export { RIG_SCALE, up };
