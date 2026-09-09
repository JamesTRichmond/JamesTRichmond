/* ============================================================================
   scenes.js — the places the robot can be.

   Every scene is static SVG built once at boot and toggled by opacity, so
   switching costs nothing at runtime. Colors are drawn from the page's own
   design tokens, which is why the scenery re-flavors along with everything
   else when you switch chocolates.
   ========================================================================== */

export const SCENES = {
  /* ── Workshop: home base. Idles, sleeps, and turns a wrench here. ──────── */
  workshop: {
    groundY: 432,
    label: "the workshop",
    art: `
      <rect x="0" y="0" width="1200" height="520" fill="var(--hb-bg)"/>

      <!-- back wall -->
      <rect x="0" y="120" width="1200" height="312" fill="var(--hb-surface)" opacity=".55"/>
      <!-- pegboard -->
      <g opacity=".5">
        <rect x="120" y="150" width="260" height="150" rx="6" fill="var(--hb-raised)"/>
        <g stroke="var(--hb-bg)" stroke-width="2" opacity=".5">
          <path d="M150 175h200M150 205h200M150 235h200M150 265h200"/>
        </g>
        <!-- hanging tools -->
        <g stroke="var(--hb-ink-dim)" stroke-width="5" stroke-linecap="round" fill="none">
          <path d="M175 172v44"/><path d="M175 216l10 12"/>
          <path d="M215 172v34"/><path d="M205 206h20"/>
          <path d="M255 172v50"/>
          <path d="M300 176l24 24-24 24"/>
        </g>
      </g>

      <!-- workbench -->
      <g>
        <rect x="700" y="300" width="330" height="16" rx="4" fill="var(--hb-raised)"/>
        <rect x="716" y="316" width="14" height="116" fill="var(--hb-raised)" opacity=".75"/>
        <rect x="1000" y="316" width="14" height="116" fill="var(--hb-raised)" opacity=".75"/>
        <!-- clutter -->
        <rect x="742" y="278" width="34" height="22" rx="3" fill="var(--hb-chassis-lo)"/>
        <rect x="790" y="286" width="18" height="14" rx="2" fill="var(--hb-accent)" opacity=".8"/>
        <circle cx="850" cy="290" r="10" fill="var(--hb-glow)" opacity=".7"/>
        <rect x="900" y="270" width="10" height="30" rx="3" fill="var(--hb-ink-dim)" opacity=".7"/>
        <rect x="922" y="282" width="46" height="18" rx="4" fill="var(--hb-chassis)" opacity=".8"/>
      </g>

      <!-- hanging lamp -->
      <defs>
        <linearGradient id="lampCone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--hb-accent)" stop-opacity=".16"/>
          <stop offset="1" stop-color="var(--hb-accent)" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <g>
        <path d="M470 120v52" stroke="var(--hb-line)" stroke-width="3"/>
        <path d="M440 172h60l-14 26h-32z" fill="var(--hb-chassis-lo)"/>
        <circle cx="470" cy="200" r="7" fill="var(--hb-accent)"/>
        <path d="M470 200 L 372 432 L 568 432 Z" fill="url(#lampCone)"/>
      </g>

      <!-- crates -->
      <g opacity=".9">
        <rect x="60" y="352" width="86" height="80" rx="5" fill="var(--hb-raised)"/>
        <path d="M60 392h86" stroke="var(--hb-bg)" stroke-width="3" opacity=".5"/>
        <rect x="150" y="382" width="60" height="50" rx="5" fill="var(--hb-raised)" opacity=".8"/>
      </g>

      <!-- his bed -->
      <rect x="212" y="414" width="228" height="18" rx="9" fill="var(--hb-glow)" opacity=".4"/>
      <rect x="224" y="402" width="62" height="14" rx="7" fill="var(--hb-glow)" opacity=".55"/>

      <!-- floor -->
      <rect x="0" y="432" width="1200" height="88" fill="var(--hb-bg)"/>
      <rect x="0" y="432" width="1200" height="3" fill="var(--hb-accent)" opacity=".35"/>
    `,
  },

  /* ── Kitchen: a stove, a pan, and more confidence than skill. ─────────── */
  kitchen: {
    groundY: 432,
    label: "the kitchen",
    art: `
      <rect x="0" y="0" width="1200" height="520" fill="var(--hb-bg)"/>
      <rect x="0" y="100" width="1200" height="332" fill="var(--hb-surface)" opacity=".5"/>

      <!-- tiles -->
      <g stroke="var(--hb-line)" stroke-width="1.5" opacity=".45">
        <path d="M0 160h1200M0 220h1200M0 280h1200"/>
        <path d="M120 100v180M240 100v180M360 100v180M480 100v180M600 100v180M720 100v180M840 100v180M960 100v180M1080 100v180"/>
      </g>

      <!-- window -->
      <g>
        <rect x="820" y="130" width="240" height="150" rx="8" fill="var(--hb-glow)" opacity=".22"/>
        <rect x="820" y="130" width="240" height="150" rx="8" fill="none" stroke="var(--hb-line)" stroke-width="4"/>
        <path d="M940 130v150M820 205h240" stroke="var(--hb-line)" stroke-width="4"/>
        <circle cx="1000" cy="168" r="16" fill="var(--hb-accent)" opacity=".5"/>
      </g>

      <!-- shelf with jars -->
      <g>
        <rect x="120" y="220" width="220" height="9" rx="3" fill="var(--hb-raised)"/>
        <rect x="140" y="184" width="26" height="36" rx="4" fill="var(--hb-visor)" opacity=".55"/>
        <rect x="178" y="176" width="26" height="44" rx="4" fill="var(--hb-accent)" opacity=".6"/>
        <rect x="216" y="190" width="26" height="30" rx="4" fill="var(--hb-glow)" opacity=".6"/>
        <rect x="254" y="180" width="26" height="40" rx="4" fill="var(--hb-chassis)" opacity=".7"/>
      </g>

      <!-- range hood -->
      <path d="M470 150h220l-28 62H498z" fill="var(--hb-chassis-lo)"/>
      <rect x="498" y="212" width="164" height="8" rx="3" fill="var(--hb-chassis)"/>

      <rect x="0" y="432" width="1200" height="88" fill="var(--hb-bg)"/>
      <rect x="0" y="432" width="1200" height="3" fill="var(--hb-accent)" opacity=".35"/>
    `,
    // Drawn in front of him, so he stands behind the counter like a person would
    fg: `
      <g>
        <rect x="396" y="344" width="368" height="18" rx="5" fill="var(--hb-raised)"/>
        <rect x="396" y="362" width="368" height="70" fill="var(--hb-surface)"/>
        <rect x="414" y="378" width="150" height="44" rx="6" fill="var(--hb-bg)" opacity=".55"/>
        <circle cx="650" cy="400" r="9" fill="var(--hb-chassis)"/>
        <circle cx="686" cy="400" r="9" fill="var(--hb-chassis)"/>
        <circle cx="722" cy="400" r="9" fill="var(--hb-accent)" opacity=".85"/>
      </g>
    `,
    // The burner glows behind the pan but in front of the wall
    mid: `
      <ellipse cx="560" cy="344" rx="46" ry="9" fill="var(--hb-chassis-lo)"/>
      <ellipse class="burner" cx="560" cy="340" rx="32" ry="7" fill="var(--hb-accent)" opacity="0"/>
    `,
  },

  /* ── Road: open desert highway, and one very small motorcycle. ────────── */
  road: {
    groundY: 440,
    label: "the open road",
    art: `
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--hb-glow)" stop-opacity=".35"/>
          <stop offset="1" stop-color="var(--hb-accent)" stop-opacity=".18"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1200" height="440" fill="url(#skyGrad)"/>
      <rect x="0" y="0" width="1200" height="440" fill="var(--hb-bg)" opacity=".55"/>

      <circle cx="960" cy="250" r="72" fill="var(--hb-accent)" opacity=".35"/>

      <!-- mesas -->
      <g fill="var(--hb-bg)" opacity=".8">
        <path d="M0 340l90-70h120l70 70z"/>
        <path d="M300 348l60-52h96l52 52z"/>
        <path d="M760 344l70-64h130l64 64z"/>
        <path d="M1040 350l52-46h108v46z"/>
      </g>

      <!-- scrub -->
      <g fill="var(--hb-surface)" opacity=".7">
        <path d="M180 400l10-22 10 22z"/><path d="M640 404l9-20 9 20z"/>
        <path d="M1010 400l11-24 11 24z"/>
      </g>

      <!-- asphalt -->
      <rect x="0" y="440" width="1200" height="80" fill="var(--hb-surface)"/>
      <rect x="0" y="440" width="1200" height="3" fill="var(--hb-ink-dim)" opacity=".35"/>
      <path class="roadline" d="M0 484h1200" stroke="var(--hb-accent)" stroke-width="5"
            stroke-dasharray="52 44" opacity=".7"/>
    `,
  },

  /* ── Mountain: a rock face that scrolls past while he climbs it. ──────── */
  mountain: {
    groundY: 432,
    label: "the mountain",
    art: `
      <rect x="0" y="0" width="1200" height="520" fill="var(--hb-bg)"/>

      <!-- sky glow + stars -->
      <circle cx="240" cy="120" r="180" fill="var(--hb-glow)" opacity=".16"/>
      <g fill="var(--hb-ink)" opacity=".45">
        <circle cx="120" cy="72" r="2"/><circle cx="300" cy="46" r="1.6"/>
        <circle cx="430" cy="104" r="2.2"/><circle cx="700" cy="60" r="1.8"/>
        <circle cx="880" cy="120" r="2"/><circle cx="1080" cy="70" r="1.6"/>
        <circle cx="560" cy="150" r="1.5"/><circle cx="980" cy="190" r="1.8"/>
      </g>

      <!-- distant peaks -->
      <path d="M0 400l180-190 130 130 120-90 150 150z" fill="var(--hb-surface)" opacity=".5"/>
      <path d="M420 420l200-210 150 160 140-110 290 180z" fill="var(--hb-surface)" opacity=".35"/>

      <!-- the wall he climbs (scrolls during the climb) -->
      <g class="rockwall">
        <rect x="520" y="-520" width="220" height="1560" fill="var(--hb-raised)"/>
        <g stroke="var(--hb-bg)" stroke-width="3" opacity=".5" fill="none">
          <path d="M520 -400l60 40 80-30 80 46"/>
          <path d="M520 -180l70 34 60-40 90 32"/>
          <path d="M520 40l54 40 92-36 74 40"/>
          <path d="M520 250l80 30 70-42 70 40"/>
          <path d="M520 470l60 36 84-30 76 34"/>
          <path d="M520 700l70 32 66-40 84 38"/>
          <path d="M520 920l58 38 90-34 72 36"/>
        </g>
        <!-- holds -->
        <g fill="var(--hb-visor)" opacity=".65">
          <circle cx="586" cy="-330" r="7"/><circle cx="674" cy="-236" r="7"/>
          <circle cx="588" cy="-120" r="7"/><circle cx="676" cy="-20" r="7"/>
          <circle cx="590" cy="96" r="7"/><circle cx="678" cy="196" r="7"/>
          <circle cx="592" cy="310" r="7"/><circle cx="680" cy="410" r="7"/>
          <circle cx="594" cy="520" r="7"/><circle cx="682" cy="620" r="7"/>
          <circle cx="596" cy="740" r="7"/><circle cx="684" cy="840" r="7"/>
        </g>
      </g>

      <!-- foreground ledge -->
      <path d="M0 432h1200v88H0z" fill="var(--hb-bg)"/>
      <path d="M0 432h520v6H0z" fill="var(--hb-accent)" opacity=".3"/>
      <path d="M740 432h460v6H740z" fill="var(--hb-accent)" opacity=".3"/>
    `,
  },
};

/** Scene fixtures the robot interacts with — kept out of the static art so an
 *  activity can move them (the lifted bike, the pan, the wrench). */
export const PROPS = `
  <!-- motorcycle: used by both the ride and the oil change -->
  <g class="prop prop-bike" opacity="0">
    <g class="bike-wheel bike-wheel-b">
      <circle r="30" fill="none" stroke="var(--hb-chassis-lo)" stroke-width="8"/>
      <g stroke="var(--hb-chassis)" stroke-width="3">
        <path d="M-22 0h44M0 -22v44M-16-16l32 32M-16 16l32-32"/>
      </g>
    </g>
    <g class="bike-wheel bike-wheel-f">
      <circle r="30" fill="none" stroke="var(--hb-chassis-lo)" stroke-width="8"/>
      <g stroke="var(--hb-chassis)" stroke-width="3">
        <path d="M-22 0h44M0 -22v44M-16-16l32 32M-16 16l32-32"/>
      </g>
    </g>
    <g class="bike-frame">
      <path d="M-58 -6 L -18 -34 L 40 -34 L 58 -6" fill="none" stroke="var(--hb-accent)" stroke-width="9"
            stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M-30 -34 h44 l6 16 h-48z" fill="var(--hb-chassis)"/>
      <!-- ape hangers, set where his hands actually land -->
      <path d="M40 -34 l14 -62" stroke="var(--hb-chassis)" stroke-width="7" stroke-linecap="round"/>
      <path d="M46 -96 h24" stroke="var(--hb-chassis-hi)" stroke-width="7" stroke-linecap="round"/>
      <!-- foot peg, likewise -->
      <rect x="14" y="-5" width="22" height="8" rx="4" fill="var(--hb-chassis-lo)"/>
      <circle cx="-52" cy="-14" r="6" fill="var(--hb-visor)"/>
    </g>
  </g>

  <!-- the jack holding the bike up -->
  <g class="prop prop-jack" opacity="0">
    <rect x="-46" y="-24" width="92" height="14" rx="4" fill="var(--hb-chassis-lo)"/>
    <path d="M-30 -10 L -16 -104 M30 -10 L 16 -104" stroke="var(--hb-chassis-lo)" stroke-width="9"
          stroke-linecap="round"/>
    <rect x="-24" y="-116" width="48" height="12" rx="4" fill="var(--hb-chassis)"/>
  </g>

  <!-- oil pan under the lift -->
  <g class="prop prop-oilpan" opacity="0">
    <path d="M-28 0 h56 l-6 18 h-44z" fill="var(--hb-chassis-lo)"/>
    <path class="oil-level" d="M-23 9 h46 l-3 9 h-40z" fill="var(--hb-glow)" opacity="0"/>
  </g>

  <!-- frying pan, held during cooking -->
  <g class="prop prop-pan" opacity="0">
    <ellipse rx="30" ry="8" fill="var(--hb-chassis-lo)"/>
    <path d="M28 -2 h34" stroke="var(--hb-chassis-lo)" stroke-width="7" stroke-linecap="round"/>
  </g>
`;
