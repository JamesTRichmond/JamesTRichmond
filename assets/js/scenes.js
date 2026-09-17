/* ============================================================================
   scenes.js — four pages from a very small robot's field notebook.

   Static, hand-authored SVG; the activity hooks and prop origins stay separate
   from the pencil marks so scenery and moving parts share the same drawing.
   ========================================================================== */

export const SCENES = {
  workshop: {
    groundY: 432,
    label: "the workshop",
    art: `
      <rect width="1200" height="520" fill="var(--bg-deep)"/>
      <g fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <!-- The wall is suggested, not painted in. -->
        <g stroke="var(--line)" stroke-width=".8" opacity=".55">
          <path d="M34 134l1129-3M38 137l380-1m196-1 536-1M38 138l-2 271m1122-270 3 264"/>
          <path d="M48 150h12m-6-6v12M1138 150h12m-6-6v12M48 406h12m-6-6v12"/>
          <path d="M396 158h31m-16 0v128m-4-108 8-1m-8 48h8m-8 46h8"/>
          <path d="M690 325v108m-5-107h10m-10 105h10"/>
        </g>
        <g fill="var(--ink-dim)" stroke="none" font-family="ui-monospace, monospace" font-size="10" letter-spacing="1.5">
          <text x="61" y="119">FIG. 01 / THE REPAIR DEPARTMENT</text>
          <text x="1091" y="119">NO. 004</text>
        </g>
        <path d="M60 125l217 1m7-1 39 1" stroke="var(--accent)" stroke-width="2"/>

        <!-- A crooked pegboard and tools made out of separate pen strokes. -->
        <path d="M116 161l265-4-3 146-263-3z" fill="var(--surface)" fill-opacity=".35"/>
        <path d="M119 164l257-4 3 140-261-3m-6-130 1 128" stroke-width=".7"/>
        <g stroke="var(--line)" stroke-width="2" stroke-dasharray="1 16">
          <path d="M133 177l229-2M132 195h231M132 215l228-1M132 236h231M132 257l229 1M132 278h231"/>
        </g>
        <g stroke-width="1.8" fill="var(--bg-deep)">
          <path d="M167 179l-7 7 2 11 8 4-1 43q4 8 9 0l-1-43 8-6-1-12-7-5 1 12-9 1z"/>
          <path d="M211 182l18-2 3 9-10 4 2 53-8 1-1-54-12 1-2-10z"/>
          <path d="M258 181l4 28 5 6-1 29q-5 7-10 0l-1-28 4-7-5-27z"/>
          <path d="M314 184q-21 4-9 21l10 14-13 24 5 3 14-20 12 20 5-4-13-24 10-15q8-16-6-21l-3 15-9 2z"/>
        </g>
        <path d="M172 210l1 31m47-43 1 44m37-18 6-1m-6 5h6m-6 5h6m-6 5h6M309 201l20 8"/>
        <path d="M155 270l26-2m-23 6 25-2M207 267h25m-23 5 28-1M254 268h16M306 269l32-2" stroke="var(--iri-p)" stroke-width="1"/>
        <g fill="var(--ink-dim)" stroke="none" font-family="cursive" font-size="12">
          <text x="130" y="323" transform="rotate(-3 130 323)">one of these will fix it.</text>
        </g>
        <path d="M276 317q41 4 56-16m-7 3 7-3-1 8" stroke="var(--ink-dim)" stroke-width="1"/>

        <!-- Folded diagram, taped to the wall. -->
        <path d="M766 152l205 6-5 71-202-4z" fill="var(--chassis-hi)"/>
        <path d="M770 155l-2 66 192 5M955 158l-3 65" stroke="var(--line)" stroke-width=".7"/>
        <path d="M779 149l24 2-2 9-23-2zM938 155l25 1 1 9-26-2z" fill="var(--surface)" stroke="var(--line)" stroke-width=".7"/>
        <g stroke="var(--iri-p)" stroke-width="1">
          <path d="M802 176l32 1 1 23-34-1zM798 174l38 1M808 201l-2 13m22-12 2 13M802 189l-12 8m45-9 10 9M817 173v-8"/>
          <circle cx="817" cy="163" r="2"/>
          <path d="M808 185h4m12 0h4m-18 7 16 1M790 170v41m-4-4 8 1m-8-32h8"/>
          <path d="M853 183l29-6m-23 2-6 4 7 1M851 207h36m-31-4-5 4 6 2"/>
        </g>
        <g fill="var(--ink-dim)" stroke="none" font-family="cursive" font-size="11">
          <text x="887" y="181">mostly bolts</text>
          <text x="889" y="209">+ a little soul</text>
        </g>
        <path d="M1013 169q33-23 57 0t44-1m-99 5q27-19 57-1t42-1" stroke="var(--line)" stroke-width=".8"/>
        <g fill="var(--accent)" stroke="none" font-family="cursive" font-size="17">
          <text x="1007" y="206" transform="rotate(5 1007 206)">good enough!</text>
        </g>

        <!-- The tabletop is kept clear for the three draggable spare parts. -->
        <path d="M700 300l109-1 106 2 115-1-1 16-162 1-166-1z" fill="var(--surface)" stroke-width="2"/>
        <path d="M703 304l152-1 169 2M703 312l92 1m9 0 79-1m15 1 128-1" stroke-width=".8"/>
        <path d="M716 317l14 1-1 113-13 1zM1000 317l14-1-1 116-14-1z" fill="var(--bg-deep)"/>
        <path d="M720 321l-1 107m285-108-2 108M730 391l268-1 1 9-269 1z" fill="var(--surface)" stroke-width="1"/>
        <path d="M731 320l266 68m-260-67 259 64M735 384l54-15m150-40 57-14" stroke="var(--line)" stroke-width="1"/>
        <g stroke-width=".8">
          <path d="M706 306l7 8m1-8 7 9m2-8 7 8m2-9 8 9m1-9 8 9m2-9 7 9m246-9 8 8m1-8 8 8m0-8 7 8"/>
          <path d="M718 398l10 8m-10-2 10 8m-10-2 10 8m-10-2 10 8M1001 403l11 8m-11-2 10 8m-10-2 11 8"/>
        </g>
        <g fill="var(--ink)" stroke="none" font-family="cursive" font-size="15">
          <text x="754" y="247" transform="rotate(-2 754 247)">spare parts / take one</text>
        </g>
        <path d="M959 242q37 4 36 38m-5-6 5 6 4-8" stroke="var(--accent)" stroke-width="1.3"/>
        <path d="M754 252q90 3 156-1" stroke="var(--iri-p)" stroke-width="1"/>
        <g fill="var(--ink-dim)" stroke="none" font-family="ui-monospace, monospace" font-size="9">
          <text x="759" y="335">01</text><text x="849" y="335">02</text><text x="946" y="335">03</text>
        </g>
        <!-- A little coil of cable under the bench. -->
        <path d="M812 403c-23-16-50 18-18 22s42-29 10-26-29 32 1 27 32-24 8-25-26 22-5 22m-22-7-23 8 2 7"/>
        <path d="M831 415q33 18 57 8l8 6m-2-3 8-4 6 7-8 4z" stroke-width="1"/>

        <!-- The lamp's physical bounds are also used by thrown objects. -->
        <path d="M470 132q-3 19 0 40m3-40q-1 20-1 35" stroke-width="1.2"/>
        <path d="M440 172l30 1 30-1-14 26-32 1z" fill="var(--surface)" stroke-width="2"/>
        <path d="M445 177l48-1m-44 6 41-1m-38 10 35-1" stroke-width=".7"/>
        <path d="M458 175l9 21m-2-21 10 20m-2-20 10 20" stroke-width=".7" stroke="var(--line)"/>
        <path d="M465 199q4 11 10 0" fill="var(--accent)" stroke="var(--accent)"/>
        <g stroke="var(--accent)" stroke-width="1" opacity=".6">
          <path d="M449 210l-9 13m30-11v17m20-19 10 12M445 231l-16 31m42-23 1 27m25-33 16 28"/>
          <path d="M425 277l-8 16m104-16 8 14" stroke-dasharray="2 5"/>
        </g>
        <g fill="var(--ink-dim)" stroke="none" font-family="cursive" font-size="12">
          <text x="530" y="187" transform="rotate(-4 530 187)">bright idea no. 7</text>
        </g>
        <path d="M545 195q-12 18-45 10m5-3-5 3 5 4" stroke="var(--ink-dim)" stroke-width=".8"/>

        <!-- Crates keep their original collision silhouettes. -->
        <path d="M60 352l85 1 1 79-86-1zM150 382l60 1-1 49-59-1z" fill="var(--surface)"/>
        <path d="M64 356l78 1-1 71-78-1zM154 386l52 1-1 40-51 1z" stroke-width=".8"/>
        <path d="M61 372l83 1m-83 18 84 1m-85 19 86 1M151 405l57 1" stroke-width="1"/>
        <path d="M66 356l73 71m-69-71 69 67M65 426l75-69m-70 68 72-65M156 388l47 37m-47-3 47-34" stroke-width=".9"/>
        <path d="M67 362h1m68 0h1m-70 57h1m68 0h1M157 391h1m44 0h1m-46 32h1m44 0h1" stroke-width="3"/>
        <path d="M84 377l38 1-1 25-38-1z" fill="var(--bg-deep)" stroke-width=".8"/>
        <g stroke="none" fill="var(--accent)" font-family="ui-monospace, monospace" font-size="9">
          <text x="89" y="388" transform="rotate(3 89 388)">ODDS</text>
          <text x="88" y="399" transform="rotate(3 88 399)">+ ENDS</text>
        </g>

        <!-- A patched canvas bed, at the activity's original sleeping position. -->
        <path d="M221 414q102-3 208 0 10 1 11 9-1 9-11 9l-206-1q-12 0-11-9 0-6 9-8z" fill="var(--surface)"/>
        <path d="M217 423q104-3 216 1M228 431l-2 5m196-4 3 4" stroke-width=".8"/>
        <path d="M224 412q-2-10 9-11l46 2q10 3 7 12-32-3-62 0z" fill="var(--bg-deep)"/>
        <path d="M229 411q22-7 51 0M310 415l-1 16m3-15-1 13" stroke="var(--iri-p)" stroke-width="1"/>
        <path d="M354 417l22 1-1 10-22-1zM358 416l-1 13m7-12-1 12m7-12-1 12" stroke="var(--iri-p)" stroke-width=".8"/>
        <g fill="var(--ink-dim)" stroke="none" font-family="cursive" font-size="12">
          <text x="241" y="369" transform="rotate(-4 241 369)">power-saving mode</text>
        </g>
        <path d="M276 375q-17 4-19 22m-4-6 4 6 4-6" stroke="var(--ink-dim)" stroke-width=".8"/>

        <path d="M0 433l113-1 100 2 205-1m12 0 134-1 188 2 193-2 255 1" stroke-width="1.6"/>
        <path d="M37 437l140 1m28-2 215 2m280-1 334 2" stroke="var(--line)" stroke-width=".8"/>
        <g stroke="var(--ink-dim)" stroke-width=".8" opacity=".65">
          <path d="M67 435l-10 8m23-8-10 9m22-9-10 9m23-9-10 9m23-9-10 9m23-9-10 9m23-9-10 9m23-9-10 9"/>
          <path d="M717 434l-12 11m25-11-12 11m25-11-12 11m25-11-12 11m255-11-12 11m25-11-12 11m25-11-12 11"/>
          <path d="M709 437l38 7m-27-9 29 5M991 437l39 7m-25-9 30 5"/>
          <path d="M60 474l79-1m873 6 48-1m-30-4 49 1M650 464l5-1 3 3-5 2zM685 477l5-3m-1-4 5 3"/>
        </g>
        <g fill="var(--ink-dim)" stroke="none" font-family="cursive" font-size="14">
          <text x="864" y="484" transform="rotate(-2 864 484)">a little mess is a good sign.</text>
        </g>
        <path d="M855 470q-14-9-12-23m-4 5 4-5 4 5" stroke="var(--ink-dim)" stroke-width=".8"/>
      </g>
    `,
  },

  kitchen: {
    groundY: 432,
    label: "the kitchen",
    art: `
      <rect width="1200" height="520" fill="var(--bg-deep)"/>
      <g fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <g stroke="var(--line)" stroke-width=".7" opacity=".55">
          <path d="M60 161l1077-2M61 221l1076 2M64 281l1074-2"/>
          <path d="M119 134l2 146m59-146-1 147m61-147 1 147m59-147-1 147m61-147-1 147m61-147-1 147m61-147 1 147m59-147-1 147m61-147 1 147m59-147-1 147m61-147 1 147m59-147-1 147m61-147 1 147m59-147-1 147m61-147 1 147m59-147-1 147m61-147 1 147"/>
        </g>
        <g fill="var(--ink-dim)" stroke="none" font-family="ui-monospace, monospace" font-size="10" letter-spacing="1.5">
          <text x="61" y="117">FIG. 02 / EXPERIMENTAL LUNCH</text>
        </g>
        <path d="M60 123l186 1" stroke="var(--accent)" stroke-width="2"/>

        <path d="M820 131l241-2-2 152-240-2z" fill="var(--bg-deep)" stroke-width="2"/>
        <path d="M826 137l228-2-1 138-228 1zM939 135l1 141m4-141-1 140M825 203l229 1m-229 4 229-1" stroke-width="1"/>
        <path d="M827 262l42-35 32 23 29-32 8 10m9 24 23-15 37 19 45-30" stroke="var(--iri-p)" stroke-width="1"/>
        <path d="M833 265l53-4m-32 8 46-4m55-3 68 4m-49 2 57 1" stroke="var(--iri-p)" stroke-width=".8"/>
        <path d="M989 160q9-12 20-1t-1 20-21-9 2-10m4-3q16-3 17 12" stroke="var(--accent)" stroke-width="1.2"/>
        <path d="M814 283l252-1-3 7-247 1z" fill="var(--surface)"/>
        <path d="M834 284l7 4m2-4 7 4m2-4 7 4m2-4 7 4m2-4 7 4" stroke-width=".7"/>

        <path d="M120 220l219-1 2 10-222-1z" fill="var(--surface)"/>
        <path d="M124 224l210-1M138 230l-1 16 23-17m153 0 1 15-21-15" stroke-width="1"/>
        <g fill="var(--bg-deep)">
          <path d="M140 189q12-5 25-1l1 31-26 1zM138 183l29-1-1 7-27 1z"/>
          <path d="M178 182l26-1 1 37-27 1zM176 176l30-1-1 7-28 1z"/>
          <path d="M216 196q13-4 26 0l-1 23-25-1zM214 190l30-1 1 7-30 1z"/>
          <path d="M254 186l26 1-1 33-26-1zM252 181l29-1 1 7-30-1z"/>
        </g>
        <path d="M145 207l16 1m-16 4 16-1M183 204l16-1m-16 5 16-1m-16 5 16-1M219 211l20 1M258 202l17 1m-17 5h17m-17 4 17 1" stroke="var(--accent)" stroke-width="1"/>
        <g fill="var(--ink-dim)" stroke="none" font-family="cursive" font-size="11">
          <text x="136" y="265" transform="rotate(-3 136 265)">salt. bolts. probably salt.</text>
        </g>
        <path d="M294 256q11-7 7-19m-4 5 4-5 4 5" stroke="var(--ink-dim)" stroke-width=".8"/>

        <path d="M471 151l218-1-27 63-164-1z" fill="var(--surface)"/>
        <path d="M476 155l207-1-24 55-157-1M499 214l164 1-1 6-163-1z" stroke-width=".9"/>
        <path d="M480 160l19 45m-10-45 16 38m-7-38 14 33m-5-33 13 26m-4-26 10 19" stroke="var(--ink-dim)" stroke-width=".8"/>
        <path d="M554 155l51-1-1 20-49-1z" fill="var(--bg-deep)" stroke-width=".8"/>
        <g fill="var(--accent)" stroke="none" font-family="ui-monospace, monospace" font-size="9">
          <text x="563" y="167">HOT!</text>
        </g>
        <path d="M635 258l69-7 8 65-72 7z" fill="var(--chassis-hi)" stroke-width="1"/>
        <path d="M644 264l40-4m-39 12 54-6m-53 13 39-4m-38 12 51-6m-50 13 33-4" stroke="var(--iri-p)" stroke-width=".8"/>
        <g fill="var(--ink-dim)" stroke="none" font-family="cursive" font-size="11">
          <text x="642" y="312" transform="rotate(-6 642 312)">recipe-ish</text>
        </g>
        <path d="M0 433l224-1 209 2 196-1 301 1 270-2M71 437l256 1m504 0 265-1"/>
        <path d="M410 436l-12 10m28-10-12 10m28-10-12 10m28-10-12 10m287-10-12 10m28-10-12 10m28-10-12 10M401 439l45 6m280-6 37 7" stroke="var(--line)" stroke-width=".8"/>
        <g fill="var(--ink-dim)" stroke="none" font-family="cursive" font-size="14">
          <text x="820" y="393" transform="rotate(3 820 393)">chef's special: loose screws</text>
        </g>
        <path d="M826 400q81 9 163 6" stroke="var(--accent)" stroke-width=".8"/>
      </g>
    `,
    // The counter masks the lower body while the robot cooks behind it.
    fg: `
      <g stroke="var(--ink)" stroke-linejoin="round" stroke-linecap="round">
        <path d="M396 361l368 1-1 71-367-1z" fill="var(--surface)" stroke-width="1.5"/>
        <path d="M396 344l183-1 185 2-1 17-183-2-184 2z" fill="var(--bg-deep)" stroke-width="1.8"/>
        <path d="M400 349l156-1 203 1M400 358l150-1m13 0 197 2" fill="none" stroke-width=".8"/>
        <path d="M415 378l149 1-1 43-149-1z" fill="var(--bg-deep)" stroke-width="1.2"/>
        <path d="M420 382l138 1-1 34-138 1zM451 388l74 1m-69 4 65-1" fill="none" stroke-width=".8"/>
        <path d="M423 400l14 15m-14-21 21 21m-17-26 24 25m-13-25 24 25" fill="none" stroke="var(--line)" stroke-width=".7"/>
        <g fill="var(--bg-deep)" stroke-width="1.3">
          <circle cx="650" cy="400" r="9"/><circle cx="686" cy="400" r="9"/><circle cx="722" cy="400" r="9"/>
        </g>
        <path d="M650 394l-1 6m38-6-1 6m40-4-4 4M648 386l4-1m32 0h4m33-1 3 1" fill="none" stroke="var(--accent)" stroke-width="1.6"/>
        <path d="M581 367l1 60m-179-13 13 14m-13-8 7 8m337-10 12 10m-7-15 7 7" fill="none" stroke="var(--line)" stroke-width=".8"/>
      </g>
    `,
    mid: `
      <g fill="none" stroke="var(--ink)" stroke-width="1.3">
        <ellipse cx="560" cy="344" rx="46" ry="9"/>
        <path d="M519 345q39 12 82-1M536 336l-2 16m23-17v18m26-17 2 15" stroke-width=".8"/>
      </g>
      <ellipse class="burner" cx="560" cy="340" rx="32" ry="7" fill="var(--accent)" opacity="0"/>
    `,
  },

  road: {
    groundY: 440,
    label: "the open road",
    art: `
      <rect width="1200" height="520" fill="var(--bg-deep)"/>
      <g fill="none" stroke="var(--ink)" stroke-linecap="round" stroke-linejoin="round">
        <g fill="var(--ink-dim)" stroke="none" font-family="ui-monospace, monospace" font-size="10" letter-spacing="1.5">
          <text x="61" y="117">FIG. 03 / THE LONG WAY HOME</text>
        </g>
        <path d="M60 123l198 1" stroke="var(--accent)" stroke-width="2"/>
        <g stroke="var(--iri-p)" stroke-width=".9" opacity=".65">
          <path d="M79 203q27-16 46-6 13-28 46-15 9-18 30-6l31 22-155 6m11-4 124 1"/>
          <path d="M380 159q17-13 33-4 25-29 47-2l31 5-112 3"/>
          <path d="M734 201l79-1m-54 6 96-2M290 252l109-1m-74 7h35"/>
        </g>
        <path d="M894 251c-4-40 22-76 67-73s70 37 67 76-35 69-73 66-62-26-61-69z" stroke="var(--accent)" stroke-width="1.8"/>
        <path d="M899 247c-2-42 31-69 64-65s66 34 61 72m-3 10q-10 45-53 51" stroke="var(--accent)" stroke-width=".7"/>
        <path d="M914 208l80 3m-87 7 96 2m-101 7 107 2m-110 7 116 1m-118 8 120 1m-119 8 119 1m-116 8 113 1m-110 8 102 1" stroke="var(--accent)" stroke-width=".6" opacity=".5"/>
        <path d="M0 340l36-25 22-3 32-42 54 2 66-2 28 38 21 10 21 24" stroke-width="1.8"/>
        <path d="M7 342l83-68 114 1 70 66M97 277l-9 26 13 13-8 27m60-66 13 28-8 15 13 22m22-61 13 30 31 23" stroke-width=".8"/>
        <path d="M300 348l32-22 28-30 56 1 40-1 22 33 30 19M760 344l41-38 29-26 67 2 63-2 31 37 33 27M1040 350l30-22 22-24 108 1" stroke-width="1.5"/>
        <path d="M365 301l-11 31m17-26-9 30m17-24-8 26m16-20-7 24M837 285l-15 31m24-29-16 37m25-33-18 39m27-34-17 42M1097 309l-11 26m19-24-9 26m17-24-9 26" stroke-width=".8"/>
        <path d="M13 355l174-3m-94 8 217-3m147 6 96-2m182-3 270-1m30 4 160-1" stroke="var(--line)" stroke-width=".8"/>

        <path d="M184 399l2-42q5-8 9 0l-1 42m-8-16-13-2-2-16m22 6 14-2 1-14" stroke-width="1.7"/>
        <path d="M189 362l-1 31m-13-17 10 1m9-2 9-2" stroke-width=".6"/>
        <path d="M633 405l7-14 3 13 8-23 2 22 9-9M1013 404l1-46q4-7 8 0l-1 46m-7-18-13-3-1-15m22 2 13-4 1-10" stroke-width="1.3"/>
        <path d="M169 403l41-1m423 8 35-1m326 0 43-2" stroke="var(--line)" stroke-width=".8"/>
        <path d="M1088 397l-1-61m-18-27 52-3 12 15-14 16-50 1z" fill="var(--bg-deep)" stroke-width="1.5"/>
        <path d="M1074 332l42-1 9-10m-8-13 10 12" stroke-width=".7"/>
        <g fill="var(--ink)" stroke="none" font-family="cursive" font-size="13">
          <text x="1075" y="325" transform="rotate(-3 1075 325)">away</text>
          <text x="822" y="391" transform="rotate(-3 822 391)">no particular hurry.</text>
        </g>
        <path d="M862 398l87-2" stroke="var(--iri-p)" stroke-width="1"/>
        <path d="M0 440l210-1 201 2 221-2 247 2 321-1" stroke-width="2"/>
        <path d="M0 445l314-1m30 1 272-1m88 0 257 1m21-1 218 1" stroke-width=".7"/>
        <path d="M47 452l-11 10m25-10-12 10m27-10-12 10m27-10-12 10m27-10-12 10M1009 451l-13 12m27-12-13 12m27-12-13 12m27-12-13 12M34 455l70 5m897-5 48 5" stroke="var(--line)" stroke-width=".8"/>
      </g>
      <path class="roadline" d="M0 484q300-2 600 0t600 0" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="52 44" opacity=".8"/>
    `,
  },

  mountain: {
    groundY: 432,
    label: "the mountain",
    art: `
      <rect width="1200" height="520" fill="var(--bg-deep)"/>
      <g fill="none" stroke="var(--ink)" stroke-linecap="round" stroke-linejoin="round">
        <g fill="var(--ink-dim)" stroke="none" font-family="ui-monospace, monospace" font-size="10" letter-spacing="1.5">
          <text x="61" y="117">FIG. 04 / UP IS A DIRECTION</text>
        </g>
        <path d="M60 123l186 1" stroke="var(--accent)" stroke-width="2"/>
        <path d="M227 166q-27 15-9 38 22 18 38-3-29 7-29-35z" stroke="var(--iri-p)" stroke-width="1.1"/>
        <path d="M114 181h10m-5-5v10M296 160h8m-4-4v8M428 204h10m-5-5v10M878 172h10m-5-5v10M1073 151h10m-5-5v10M975 239h8m-4-4v8" stroke="var(--line)" stroke-width=".8"/>
        <path d="M0 400l67-70 33-18 80-102 54 56 20 42 56 32 59-49 25-5 36-36 150 150M420 420l102-109 37-24 61-77 77 79 30 44 43 37 73-62 35-18 32-30 111 77 43 11 136 92" stroke="var(--iri-p)" stroke-width="1.2"/>
        <path d="M142 258l38-48 27 28 28 30-31-9-21 11-18-9-23 8M589 248l31-38 36 38-21-4-14 14-18-11z" stroke="var(--iri-p)" stroke-width=".8"/>
        <path d="M180 273l-35 60 11 21-54 53m83-126-23 53 10 15-37 42M427 259l-34 70 11 25-41 45M909 271l-33 73 12 21-37 40m61-120-25 60 12 18-23 30" stroke="var(--line)" stroke-width=".8"/>
        <g fill="var(--ink-dim)" stroke="none" font-family="cursive" font-size="14">
          <text x="824" y="203" transform="rotate(-4 824 203)">seemed smaller on the map.</text>
        </g>
        <path d="M853 213q-53 14-81 67m1-9-1 9 8-4" stroke="var(--ink-dim)" stroke-width=".9"/>
      </g>

      <!-- Extra height allows the activity to scroll the climbing face. -->
      <g class="rockwall" stroke="var(--ink)" stroke-linejoin="round" stroke-linecap="round">
        <path d="M520-520l218 1 2 1559-221-1z" fill="var(--surface)" stroke-width="1.8"/>
        <g fill="none" stroke-width=".8">
          <path d="M525-520l-1 130 5 92-5 112 3 130-3 136 4 110-4 119 3 141-4 139 4 172-3 178M735-520l-1 170-4 107 5 109-3 138 4 132-5 117 4 151-4 130 5 153-4 164 3 183"/>
          <path d="M520-400l60 40 80-30 80 46M520-180l70 34 60-40 90 32M520 40l54 40 92-36 74 40M520 250l80 30 70-42 70 40M520 470l60 36 84-30 76 34M520 700l70 32 66-40 84 38M520 920l58 38 90-34 72 36"/>
          <path d="M580-360l-13 65 32 29-9 120m60-40 17-46-7-52M574 80l-8 63 35 35-1 102m66-236 12 65-25 29 17 100M580 506l-13 64 30 42-7 120m74-256 15 72-28 29 5 115M578 958l-12 63"/>
          <path d="M529-388l41 35m-41-25 37 31m-37-21 33 27m-33-16 31 24M530-163l44 33m-44-23 39 30m-39-19 34 24M529 56l36 32m-36-22 33 31m-33-21 31 28m-31-18 29 26M530 265l53 30m-53-20 47 30m-47-20 42 30m-42-20 35 29M529 486l39 33m-39-23 35 32m-35-22 31 30M530 716l43 31m-43-21 38 30m-38-20 33 29M529 936l35 31m-35-21 31 29"/>
          <path d="M537-389l-3 42m10-36-3 43M538 62l-3 42m12-32-3 41M539 272l-3 43m12-38-3 45M538 490l-3 43m12-34-3 42M538 720l-3 42m12-33-3 42"/>
          <path d="M697-410l18-23 8 32-26-9zM689-80l23-18 12 29-35-11zM696 166l20-22 10 34-30-12zM691 369l21-20 10 32-31-12zM696 596l19-22 9 33-28-11zM694 816l18-23 12 34-30-11z" stroke="var(--line)"/>
        </g>
        <g fill="var(--iri-p)" fill-opacity=".28" stroke="var(--iri-p)" stroke-width="1.5">
          <path d="M579-332l7-5 9 6-4 8-11-1zM667-240l9-4 7 9-5 7-12-3z"/>
          <path d="M581-124l8-4 8 8-5 7-12-2zM669-24l9-4 7 9-5 7-12-3z"/>
          <path d="M583 92l8-4 8 8-5 7-12-2zM671 192l9-4 7 9-5 7-12-3z"/>
          <path d="M585 306l8-4 8 8-5 7-12-2zM673 406l9-4 7 9-5 7-12-3z"/>
          <path d="M587 516l8-4 8 8-5 7-12-2zM675 616l9-4 7 9-5 7-12-3z"/>
          <path d="M589 736l8-4 8 8-5 7-12-2zM677 836l9-4 7 9-5 7-12-3z"/>
        </g>
        <g fill="none" stroke="var(--accent)" stroke-width="1" opacity=".6">
          <path d="M617-334q52 34 26 83t-21 115 22 111-16 123 23 117-17 99 23 112-15 109 20 105-14 122 13 94" stroke-dasharray="3 8"/>
          <path d="M709 89l-1 23m-5-7 5 7 5-7M711 308l-1 23m-5-7 5 7 5-7"/>
        </g>
      </g>
      <path d="M0 432h520v88H0zM740 432h460v88H740z" fill="var(--bg-deep)"/>
      <g fill="none" stroke="var(--ink)" stroke-linecap="round">
        <path d="M0 433l126-1 146 2 248-2M740 433l126-1 189 2 145-1" stroke-width="1.5"/>
        <path d="M394 438l119 1m230-1 120 1M416 438l-11 10m23-10-11 10m23-10-11 10m23-10-11 10M750 438l-11 10m23-10-11 10m23-10-11 10m23-10-11 10" stroke="var(--line)" stroke-width=".8"/>
        <path d="M447 430l16-19 27 3 14 17m-40-17 9 16m14-13-5 11M798 431l11-11 18 11" stroke-width=".9"/>
      </g>
    `,
  },
};

/** Fixtures moved by activities; class names and local pivots are public hooks. */
export const PROPS = `
  <g class="prop prop-bike" opacity="0" stroke="var(--ink)" stroke-linecap="round" stroke-linejoin="round">
    <g class="bike-wheel bike-wheel-b">
      <path d="M-30-1c0-17 12-30 30-29s31 13 30 32-14 29-32 28S-31 16-30-1z" fill="var(--bg-deep)" stroke-width="2.2"/>
      <circle r="25" fill="none" stroke-width=".9"/>
      <path d="M-29-3c-3-16 14-29 31-28m27 39q-4 24-29 24" fill="none" stroke-width=".7"/>
      <g fill="none" stroke-width=".9">
        <path d="M-23 0l46 1M1-23l-2 46M-16-17l33 34M-17 16l34-32"/>
        <path d="M-8-23l15 46M-23 8l46-16"/>
        <circle r="4" fill="var(--surface)"/>
      </g>
    </g>
    <g class="bike-wheel bike-wheel-f">
      <path d="M-30 1c-1-19 15-32 32-31S31-15 30 2 15 32-2 30-30 18-30 1z" fill="var(--bg-deep)" stroke-width="2.2"/>
      <circle r="25" fill="none" stroke-width=".9"/>
      <path d="M-30 4q-5-29 29-36m31 37q-4 28-31 27" fill="none" stroke-width=".7"/>
      <g fill="none" stroke-width=".9">
        <path d="M-23 0l46-1M-1-23l2 46M-17-16l34 32M-16 17l32-34"/>
        <path d="M8-23l-15 46M-23-8l46 16"/>
        <circle r="4" fill="var(--surface)"/>
      </g>
    </g>
    <g class="bike-frame">
      <path d="M-58-6l40-28 58 0 18 28M-57-4l41-25 53-1L55-5" fill="none" stroke="var(--accent)" stroke-width="2.2"/>
      <path d="M-56-2l43-2-5-29m6 29 50-29M-52-10l-8 10 49-1 18-31" fill="none" stroke-width="1.3"/>
      <path d="M-30-34l44-1 6 17-48-1z" fill="var(--bg-deep)" stroke-width="1.7"/>
      <path d="M-26-29l36-1 3 7-38 1M-16-17l-5 12 31 1-6-13" fill="none" stroke-width=".8"/>
      <path d="M-14-13l15 1m-17 3 18 1m-29-28 35-1" fill="none" stroke-width="1"/>
      <path d="M-38-38l29-1 3 5-35 1z" fill="var(--surface)" stroke-width="1.2"/>
      <path d="M40-34l14-62m-10 63 13-61" fill="none" stroke-width="1.8"/>
      <path d="M46-96l24 1m-23-4 23 1" fill="none" stroke-width="1.8"/>
      <path d="M63-99l-1 6m4-6-1 6m4-6-1 6" stroke-width=".8"/>
      <path d="M14-5l22 1-1 7-21-1z" fill="var(--surface)" stroke-width="1.2"/>
      <path d="M19-3l-1 4m6-4-1 4m6-4-1 4" stroke-width=".8"/>
      <path d="M-72-21q13-9 28-1M44-23q14-9 28 1" fill="none" stroke-width="1.4"/>
      <circle cx="-52" cy="-14" r="6" fill="var(--iri-p)" fill-opacity=".35" stroke-width="1"/>
      <path d="M-8-29l9 1m-5-4v7" fill="none" stroke="var(--accent)" stroke-width="1"/>
    </g>
  </g>

  <g class="prop prop-jack" opacity="0" stroke="var(--ink)" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-46-24l92 1-1 13-91-1z" fill="var(--surface)" stroke-width="1.6"/>
    <path d="M-30-11l14-93m-9 93 14-91M30-11l-14-93m9 93-14-91M-23-48l45 1M-39-18l75 1" fill="none" stroke-width="1.4"/>
    <path d="M-24-116l48 1-1 11-47-1z" fill="var(--bg-deep)" stroke-width="1.5"/>
    <path d="M-19-113l7 8m0-8 7 8m0-8 7 8m0-8 7 8m0-8 7 8" fill="none" stroke="var(--accent)" stroke-width=".8"/>
    <path d="M3-44l29-30 15-1m-15-3 15-1" fill="none" stroke-width="1.5"/>
  </g>

  <g class="prop prop-oilpan" opacity="0" stroke="var(--ink)" stroke-linejoin="round">
    <path d="M-28 0l56 1-6 17-44-1z" fill="var(--surface)" stroke-width="1.6"/>
    <path class="oil-level" d="M-23 9q23-2 46 0l-3 9h-40z" fill="var(--iri-p)" fill-opacity=".45" stroke="var(--iri-p)" stroke-width=".8" opacity="0"/>
    <path d="M-24 4l48 1M-22 7l6 8m0-8 6 8" fill="none" stroke-width=".8"/>
  </g>

  <g class="prop prop-pan" opacity="0" stroke="var(--ink)" stroke-linecap="round">
    <path d="M-30 0q-1-8 30-8T30 0Q29 9-1 8T-30 0z" fill="var(--surface)" stroke-width="1.7"/>
    <path d="M-26 0q25-9 51 0m-46 3 42 1" fill="none" stroke-width=".8"/>
    <path d="M28-2l34-1m-33 4 33-1m-6-4v5m3-5v5" fill="none" stroke-width="1.6"/>
  </g>
`;
