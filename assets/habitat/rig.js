/* ============================================================================
   rig.js — the robot's body: joint pivots and the SVG that hangs off them.

   The rig is authored at a comfortable size and scaled exactly once on the way
   to the stage. Anything expressed in rig units but consumed in stage
   coordinates has to go through `up()`, or it lands 30% off.
   ========================================================================== */

/* Joint pivots, rig-local, feet at the origin. The rig is authored at a
   comfortable size and then scaled once on the way to the stage, so every
   rig-space offset that has to be reasoned about in stage units goes through
   `up()` rather than being hand-converted in ten places. */
export const HIP_Y = -50, HIP_X = 11;
export const SHOULDER_Y = -96, SHOULDER_X = 31;
export const NECK_Y = -104;
export const THIGH = 22, UPPER_ARM = 22;
export const RIG_SCALE = 1.3;
export const up = (n) => n * RIG_SCALE;

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

export const RIG = `
<ellipse class="pet-shadow" rx="42" ry="8" fill="#000" opacity=".3"/>
<g class="pet-root">
  <!-- far-side limbs, behind and darker, which is what reads as depth -->
  <g class="limb-b" opacity=".68">
    ${limb("leg-b", { w: 17, len: THIGH }, { w: 15, len: 24, foot: true }, "var(--hb-chassis-lo)", "var(--hb-chassis-lo)")}
    ${limb("arm-b", { w: 13, len: UPPER_ARM }, { w: 11, len: 20 }, "var(--hb-chassis-lo)", "var(--hb-chassis-lo)")}
  </g>

  <g class="pet-body">
    <!-- torso -->
    <rect x="-24" y="-56" width="48" height="58" rx="15" fill="var(--hb-chassis)"/>
    <rect x="-24" y="-56" width="48" height="20" rx="15" fill="var(--hb-chassis-hi)" opacity=".5"/>
    <rect x="-15" y="-43" width="30" height="28" rx="9" fill="var(--hb-chassis-lo)" opacity=".9"/>
    <circle class="pet-core" cx="0" cy="-29" r="8.5" fill="var(--hb-glow)"/>
    <circle cx="0" cy="-29" r="19" fill="url(#__CORE__)" opacity=".6"/>
    <rect x="-18" y="-9" width="36" height="7" rx="3.5" fill="var(--hb-accent)" opacity=".9"/>
    <!-- shoulder caps, so the arms read as attached -->
    <circle cx="-25" cy="-48" r="9" fill="var(--hb-chassis-lo)"/>
    <circle cx="25" cy="-48" r="9" fill="var(--hb-chassis)"/>

    <!-- head -->
    <g class="head">
      <rect x="-26" y="-48" width="52" height="49" rx="15" fill="var(--hb-chassis)"/>
      <rect x="-26" y="-48" width="52" height="17" rx="15" fill="var(--hb-chassis-hi)" opacity=".45"/>
      <rect x="-19" y="-36" width="38" height="18" rx="9" fill="var(--hb-bg)"/>
      <rect class="visor" x="-17" y="-34.5" width="34" height="15" rx="7.5" fill="url(#__VISOR__)"/>
      <rect class="pupil" x="-5" y="-32" width="10" height="10" rx="5" fill="var(--hb-bg)" opacity=".85"/>
      <rect class="lid" x="-19" y="0" width="38" height="18" rx="9" fill="var(--hb-chassis)"/>
      <rect x="-9" y="-11" width="18" height="5" rx="2.5" fill="var(--hb-chassis-lo)" opacity=".8"/>
      <g class="antenna">
        <path d="M0 0 v-20" stroke="var(--hb-chassis-hi)" stroke-width="4.5" stroke-linecap="round"/>
        <circle class="antenna-tip" cy="-26" r="6.5" fill="var(--hb-accent)"/>
      </g>
    </g>
  </g>

  <!-- near-side limbs -->
  <g class="limb-f">
    ${limb("leg-f", { w: 17, len: THIGH }, { w: 15, len: 24, foot: true }, "var(--hb-chassis)", "var(--hb-chassis-lo)")}
    ${limb("arm-f", { w: 13, len: UPPER_ARM }, { w: 11, len: 20 }, "var(--hb-chassis)", "var(--hb-chassis-hi)")}
  </g>
</g>`;
