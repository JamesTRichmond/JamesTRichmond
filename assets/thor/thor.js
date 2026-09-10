/* ============================================================================
   thor.js — motion, colour and lightning for a still engraving.

   Nothing here generates artwork. Every moving thing is the original wood
   engraving's own pixels being pushed around, and the colour is that same
   plate's luminance mapped through a grade. A video model would re-render the
   hatching into soup; the hatching is the picture.

   THREE THINGS MOVE
     · Smoke — a domain-warped flow field over the clouds already drawn there,
       with the field varying across the frame: fast and vertical at the vent
       above the crag, slow and lateral higher up. A uniform warp is what gives
       the "underwater jelly" look that reads as fake instantly.
     · Beard and drape — a wave travelling outward from the anchored end, with
       amplitude ramped along the length so there is exactly zero movement where
       the beard meets his jaw. They share one wind field so they gust together;
       the cloth is slower and lags, being heavier.
     · The hammer charges. See below.

   THE COLOUR
     Cool shadows, warm highlights — the most reliable way to make a monochrome
     plate read as lit rather than tinted. Storm-indigo in the darks, bronze
     firelight in the highs, then a few local windows: gold on the crown and
     hammer, ember at the base of the plume, cold slate on the rock. That is
     how a colourist would grade a black-and-white frame, and it keeps every
     hatch line intact because it is a per-pixel map, not a repaint.

   THE LIGHTNING
     The glow is derived from the bolts, not from a point. That is the whole
     difference between a blob of light at the hammer and something that looks
     like discharge: the arcs are drawn to an offscreen canvas in three widths —
     a tight core, a bloom, a wide blurred halo — packed into R, G and B, and the
     shader tints each differently and adds them. Light shaped like the thing
     making it.

     The bolts grow. Early in a charge they are small and tight to the hammer
     head; as it builds they extend along an arc that carries them up over his
     crown, until at peak they span a canopy the width of his head. Underneath
     that slow swell runs a fast steppy flicker, because electricity does not
     fade up smoothly. At the top of the swell the whole frame takes a flash.

   All noise and all timing is periodic in `loop`, so a captured loop is
   seamless: frame zero and frame N are pixel-identical, no crossfade.
   ========================================================================== */

const VERT = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_src;    // the engraving
uniform sampler2D u_mask;   // R smoke · G beard+hair · B drape · A figure
uniform sampler2D u_grade;  // R metal · G flesh · B rock
uniform sampler2D u_bolt;   // R core · G bloom · B wide glow

uniform vec2  u_crop0;
uniform vec2  u_crop1;
uniform float u_t;
uniform float u_loop;
uniform float u_charge;     // 0..1, the slow swell
uniform float u_flash;      // 0..1, the moment of discharge
uniform vec2  u_hammer;
uniform vec2  u_vent;
uniform float u_amp;        // global motion scale; 0 under reduced-motion
uniform float u_debug;      // 1 masks · 2 grade masks
uniform float u_hour;       // 0 = night storm · 1 = dawn forge

/* The hour dial.

   Every colour in the grade below is written as a pair — what it is at night,
   what it is at dawn — and this mixes between them. Pulling the palette out of
   the shader body and into a parameter is the whole change: it was hidden
   information, baked into constants, and it is now visible information the
   caller sets. That is what makes a second hour cost a column of numbers
   instead of a second shader.

   It is deliberately continuous rather than a switch. A dial can be scrubbed,
   and scrubbing is how you find out that the interesting part is not either end
   but the twenty minutes in between. */
vec3 hr(vec3 night, vec3 dawn) { return mix(night, dawn, u_hour); }

/* ── periodic value noise ──────────────────────────────────────────────────
   Every moving thing in this shader has to return to its exact starting state
   at t = u_loop, because the README version is a finite set of frames played
   end to end: any phase left over at the wrap is a visible hitch once a second
   and there is nowhere to hide it.

   For the noise that means the lattice has to tile, and there are two traps in
   it. The period must be a whole number of lattice cells — mod by 2.4 does not
   repeat, because the cells do not line up with the boundary. And each octave
   samples a scaled copy of the coordinate, so a shift that wraps the base
   octave leaves the finer ones offset; the period has to scale with the octave
   too. Both are handled by carrying the period through as a parameter.

   Together those two constraints fix the drift speed: with one period per loop
   the field must travel its own period, so it crosses roughly a frame height
   per loop. Choosing the period is choosing the speed, and the speeds below are
   the nearest whole-cell values to what looked right by eye. */
float hash(vec2 p, vec2 per, float seed) {
  p = mod(p, per);
  return fract(sin(dot(p, vec2(127.1, 311.7)) + seed) * 43758.5453);
}
float vnoise(vec2 p, vec2 per, float seed) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i, per, seed),               hash(i + vec2(1, 0), per, seed), u.x),
             mix(hash(i + vec2(0, 1), per, seed),  hash(i + vec2(1, 1), per, seed), u.x), u.y);
}
float fbm(vec2 p, vec2 per, float seed) {
  return 0.60 * vnoise(p, per, seed)
       + 0.28 * vnoise(p * 2.0, per * 2.0, seed)
       + 0.12 * vnoise(p * 4.0, per * 4.0, seed);
}
const vec2 PER_Q = vec2(3.0, 3.0);   // the coarse warp
const vec2 PER_R = vec2(8.0, 7.0);   // the fine one, on a coordinate 2.3x larger

/* n whole cycles per loop. Writing every oscillator through this is what keeps
   the beard and the cloth from arriving at the wrap mid-stroke — the original
   rates were in radians per second and landed on 4.58 and 2.99 cycles, and the
   0.58 left over was a flick in his beard every time the GIF restarted. */
float cyc(float n) { return 6.2831853 * n * u_t / u_loop; }

/* One wind field, shared. Beard and cloth must gust together or they read as
   two independent stickers. Periodic in u_loop by construction. */
float wind(float t) {
  return 0.55
       + 0.28 * sin(6.2831853 * t / u_loop)
       + 0.13 * sin(6.2831853 * 2.0 * t / u_loop + 1.7)
       + 0.07 * sin(6.2831853 * 3.0 * t / u_loop + 4.1);
}

/* ── the grade ─────────────────────────────────────────────────────────────
   An engraving has no colour and no continuous tone. It has ink, and it has
   paper. Running its luminance through a colour ramp is the obvious approach
   and it does not work: the hatching averages to the middle of the range
   almost everywhere, so nearly every pixel lands on the same mid stop and you
   get the original picture under a filter.

   So this does what a colourist does instead. Decide where the light is, and
   let that decide hue — warm in the light, cool in the shadow — while the ink
   goes on carrying the form the engraver cut. Every material is described by
   two colours, its paper under the light and its ink under the same light, and
   the pixel is a mix of the pair by local ink density. Hue then comes from an
   authored decision rather than from a number the plate happens to contain,
   which is the difference between a graded picture and a tinted one. */
float density(float v) {
  float L = clamp((v - 0.07) / 0.84, 0.0, 1.0);
  L = mix(L, L * L * (3.0 - 2.0 * L), 0.72);
  return 1.0 - L;
}

vec3 screenBlend(vec3 b, vec3 s) { return 1.0 - (1.0 - b) * (1.0 - s); }

void main() {
  vec2 uv = v_uv;
  vec2 suv = mix(u_crop0, u_crop1, uv);
  vec4 m = texture(u_mask, suv);

  float gust = wind(u_t);
  float ph = u_t / u_loop;
  vec2 push = vec2(0.0);

  /* ── smoke ─────────────────────────────────────────────────────────────── */
  if (m.r > 0.004) {
    vec2 p = uv * vec2(2.6, 3.0);
    vec2 dq = vec2(0.0, -ph * PER_Q.y);
    vec2 dr = vec2(0.0, -ph * PER_R.y);
    /* The two components of each warp are separated by a hash seed rather than
       by a constant offset in the coordinate, because an offset large enough to
       decorrelate them is also large enough to wrap around the period and put
       them back on top of each other. */
    vec2 q = vec2(fbm(p + dq, PER_Q, 0.0),
                  fbm(p + dq, PER_Q, 17.3));
    vec2 r = vec2(fbm(p * 2.3 + q * 1.1 + dr, PER_R, 41.9),
                  fbm(p * 2.3 + q * 1.1 + dr, PER_R, 63.1));
    vec2 curl = (q - 0.5) * 0.020 + (r - 0.5) * 0.011;

    float d = distance(uv, u_vent);
    float near = exp(-d * d / (2.0 * 0.30 * 0.30));
    curl.y += -0.016 * near * (0.75 + 0.45 * gust);
    curl.x *= 1.0 + 1.5 * (1.0 - near);
    curl.y *= 0.55 + 0.85 * near;
    push += curl * m.r;
  }

  /* ── beard and drape ───────────────────────────────────────────────────
     The mask value doubles as a normalised distance from the anchor — zero at
     the jaw, one at the tip — so using it as the wave's phase makes the wave
     travel outward instead of the whole thing oscillating in place. */
  if (m.g > 0.004) {
    float along = m.g;
    float a = along * (0.34 + 0.66 * gust) * 0.0085;
    float sway = sin(along *  7.0 - cyc(5.0)) * 0.55
               + sin(along * 13.3 - cyc(9.0) + 1.1) * 0.28;
    push += vec2(sway * a, sin(along * 5.6 - cyc(4.0) + 0.6) * a * 0.34);
  }
  if (m.b > 0.004) {
    float along = m.b;
    float lag = wind(u_t - 0.22);
    float a = along * (0.30 + 0.70 * lag) * 0.0115;
    float sway = sin(along * 5.2 - cyc(3.0)) * 0.6
               + sin(along * 8.3 - cyc(5.0) + 2.3) * 0.24;
    push += vec2(sway * a, cos(along * 3.6 - cyc(2.0)) * a * 0.30);
  }

  vec2 sample_uv = suv + push * u_amp * (u_crop1 - u_crop0);
  float lum = texture(u_src, sample_uv).r;
  vec4 g = texture(u_grade, sample_uv);

  if (u_debug > 1.5) { outColor = vec4(g.rgb, 1.0); return; }
  if (u_debug > 0.5) { outColor = vec4(m.rgb, 1.0); return; }

  /* ── colour ──────────────────────────────────────────────────────────────
     The order is background first, then each material painted over it, tightest
     mask last — the same order you would work in by hand, and it means an
     overlap resolves to the more specific region instead of compounding. */
  float d = density(lum);
  float lit = g.a;                     // the low-frequency light field
  /* Narrow, and this is the single most consequential number in the grade. Wide
     and most of the frame sits in the warm half, which is a bright hazy picture
     with nowhere for the discharge to be the brightest thing — and a bolt drawn
     over cream clips all three channels and comes out white, so a sky that is
     too bright does not just look wrong, it destroys the colour of the
     lightning as well. Narrow, and the warmth is confined to the burst the
     engraver actually drew, with storm everywhere else. */
  // Dawn light is lower and rakes further, so the window opens a little.
  float key = smoothstep(0.30 - 0.06 * u_hour, 0.97, lit);

  // Sky: storm, crossfaded into the burst of light the engraver put behind him.
  vec3 paper = mix(hr(vec3(0.125, 0.165, 0.388), vec3(0.404, 0.322, 0.365)),
                   hr(vec3(0.965, 0.855, 0.675), vec3(1.000, 0.812, 0.545)), key);
  vec3 ink   = mix(hr(vec3(0.012, 0.024, 0.098), vec3(0.075, 0.047, 0.055)),
                   hr(vec3(0.286, 0.173, 0.122), vec3(0.361, 0.196, 0.106)), key);

  /* A ceiling. A storm is darkest directly overhead, and dropping the top of
     the frame is also what stops the sky competing with the discharge that is
     about to happen in it. */
  float lid = smoothstep(0.34, 1.0, uv.y) * (1.0 - key * 0.62);
  paper = mix(paper, hr(vec3(0.043, 0.059, 0.176), vec3(0.243, 0.180, 0.212)),
              lid * (0.82 - 0.34 * u_hour));
  ink   = mix(ink,   hr(vec3(0.006, 0.010, 0.047), vec3(0.055, 0.039, 0.051)),
              lid * (0.82 - 0.34 * u_hour));

  // Ember. It is a volcano: the base of the plume glows, and it breathes.
  float dv = distance(uv, u_vent);
  float ember = exp(-dv * dv / (2.0 * 0.135 * 0.135)) * (0.58 + 0.42 * gust);
  // Hotter at dawn: the storm is spent and the vent is the loudest thing left.
  paper = mix(paper, hr(vec3(0.930, 0.412, 0.125), vec3(1.000, 0.518, 0.114)),
              ember * (0.68 + 0.22 * u_hour));
  ink   = mix(ink,   hr(vec3(0.267, 0.067, 0.012), vec3(0.310, 0.086, 0.016)),
              ember * (0.68 + 0.22 * u_hour));

  // Stone. Colder and flatter than he is, so he separates from the crag.
  paper = mix(paper, mix(hr(vec3(0.235, 0.267, 0.361), vec3(0.353, 0.318, 0.325)),
                         hr(vec3(0.640, 0.686, 0.784), vec3(0.757, 0.694, 0.647)),
                         key), g.b);
  ink   = mix(ink,   hr(vec3(0.031, 0.043, 0.078), vec3(0.078, 0.063, 0.067)), g.b);

  /* Him. His paper warms with the key so his lit side is warm and his shadow
     side stays cool — he is backlit in this picture, and that one gradient
     across a figure is most of what makes a flat plate look three-dimensional. */
  paper = mix(paper, mix(hr(vec3(0.416, 0.278, 0.271), vec3(0.514, 0.333, 0.286)),
                         hr(vec3(0.980, 0.800, 0.655), vec3(1.000, 0.835, 0.678)),
                         smoothstep(0.14, 0.86, lit)), g.g);
  ink   = mix(ink,   hr(vec3(0.176, 0.051, 0.043), vec3(0.208, 0.078, 0.055)), g.g);

  /* Metal takes the highlight harder and holds a deeper warm shadow than skin
     does. That gap between the two ends, more than the hue, is what reads as
     metal rather than as something painted gold. */
  paper = mix(paper, mix(hr(vec3(0.400, 0.278, 0.098), vec3(0.478, 0.325, 0.106)),
                         hr(vec3(1.000, 0.933, 0.678), vec3(1.000, 0.902, 0.588)),
                         smoothstep(0.10, 0.70, lit)), g.r);
  ink   = mix(ink,   hr(vec3(0.145, 0.075, 0.012), vec3(0.184, 0.098, 0.020)), g.r);

  vec3 col = mix(paper, ink, d);

  /* ── the lightning ─────────────────────────────────────────────────────
     Three widths of the same arcs, packed into three channels and tinted
     separately: a white core, a cyan bloom, a violet halo. Because the glow
     comes from the bolt geometry it is shaped like lightning instead of being
     a lamp behind the hammer. */
  vec3 b = texture(u_bolt, uv).rgb;
  float core  = b.r;
  float bloom = b.g;
  float halo  = b.b;

  /* Lightning is not violet. It is a white-hot filament, a cyan-white bloom
     hugging it within a few pixels, and blue-violet only out at the dim edge
     where there is almost nothing left. Putting the violet in the middle is
     what turns a discharge into a stage light. */
  /* Behind him. The bolts are generated in a flat plane and without this a
     filament runs across his forehead, which stops being weather and starts
     being a mistake in the drawing. The figure mask occludes the sharp core and
     the bloom — but deliberately not the halo, because light in the air in
     front of a figure is real, and leaving it is what gives him a rim instead
     of a cut-out edge. The floor is not zero so a strike onto the crown still
     shows where it lands. */
  float occl = mix(1.0, 0.12, m.a);

  /* The weather is part of the hour. At night he is about to strike; at dawn
     the storm has already passed and the hammer is only warm. Swapping the
     palette without swapping the weather would be a filter, which is the whole
     thing this is trying not to be. */
  float storm = 1.0 - 0.88 * u_hour;

  vec3 bolt = vec3(1.00, 1.00, 0.98) * pow(core, 1.40) * 1.60 * occl
            + vec3(0.62, 0.88, 1.00) * bloom * 1.05 * occl
            + vec3(0.28, 0.46, 1.00) * halo  * 1.15;

  /* Spill, and this is the part that ties it into the picture rather than
     laying it on top: the halo lifts the sky it passes through, and it lifts
     his edge harder, so the light appears to be falling on him. */
  float spill = halo * 0.95 + bloom * 0.45;
  col = screenBlend(col, vec3(0.44, 0.60, 1.00) * spill * (0.32 + 0.95 * g.g) * storm);
  col += bolt * storm;

  // Warmth off the head between discharges, so it is never just dark metal.
  float dh = distance(uv, u_hammer);
  col = screenBlend(col, vec3(0.55, 0.74, 1.00)
        * exp(-dh * dh / (2.0 * 0.048 * 0.048)) * u_charge * (0.34 - 0.14 * u_hour));

  // The discharge lights the whole sky for a few frames. Small on purpose:
  // this is the line between cinematic and a white screen.
  col = screenBlend(col, vec3(0.58, 0.70, 1.00) * u_flash * 0.30 * storm);

  /* A vignette, and it is doing more than looking filmic. The eye goes to the
     brightest thing it can find; pulling the corners down means that thing is
     always the discharge and never a corner of sky. */
  float vig = length((uv - 0.5) * vec2(1.04, 1.0));
  col *= 1.0 - 0.40 * smoothstep(0.28, 0.74, vig);

  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

/* ── bolt generation ───────────────────────────────────────────────────────
   Midpoint displacement: take a segment, kick its midpoint sideways at random,
   recurse, halving the kick. It is the standard lightning algorithm and it
   looks right because it is self-similar the way a discharge is.

   Seeded, so a given step of a given cycle always produces the same bolt. That
   is what lets a captured loop repeat exactly while still looking like it is
   crackling differently every instant. */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function jag(rng, x0, y0, x1, y1, spread, depth) {
  let pts = [[x0, y0], [x1, y1]];
  for (let d = 0; d < depth; d++) {
    const next = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      const dx = bx - ax, dy = by - ay;
      const len = Math.hypot(dx, dy) || 1;
      const off = (rng() - 0.5) * spread;
      next.push([(ax + bx) / 2 - (dy / len) * off, (ay + by) / 2 + (dx / len) * off]);
      next.push(pts[i + 1]);
    }
    pts = next;
    spread *= 0.55;
  }
  return pts;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} opts
 * @param {HTMLImageElement} opts.src    the engraving
 * @param {HTMLImageElement} opts.mask   motion masks
 * @param {HTMLImageElement} opts.grade  colour masks
 * @param {number[]} opts.crop           [x0,y0,x1,y1] in `ref` pixels
 * @param {number[]} [opts.ref]          the space crop and landmarks are quoted
 *   in, default the original plate's 1329x1600. Everything measured off the
 *   engraving is written in those numbers and stays readable, while the plate
 *   and the masks ship at whatever size compresses best.
 * @param {number} [opts.loop]           seconds; everything is periodic in this
 * @param {number} [opts.cycles]         hammer charges per loop
 */
export function createThor(canvas, opts) {
  const { src, mask, grade, crop, loop = 8.0, cycles = 2, ref = [1329, 1600],
          hour = 0 } = opts;

  /* Declared up here rather than beside the other render state, because the
     bolt generator reads it and is defined well above that point. */
  let hour_ = Math.min(1, Math.max(0, +hour || 0));
  const gl = canvas.getContext("webgl2", { antialias: false, preserveDrawingBuffer: true });
  if (!gl) throw new Error("WebGL2 unavailable");

  const compile = (type, s) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, s);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);

  gl.bindVertexArray(gl.createVertexArray());
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  function tex(unit, image) {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (image) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    return t;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  tex(0, src);
  tex(1, mask);
  tex(2, grade);
  const boltTex = tex(3, null);

  const U = (n) => gl.getUniformLocation(prog, n);
  gl.uniform1i(U("u_src"), 0);
  gl.uniform1i(U("u_mask"), 1);
  gl.uniform1i(U("u_grade"), 2);
  gl.uniform1i(U("u_bolt"), 3);

  const [RW, RH] = ref;
  const [cx0, cy0, cx1, cy1] = crop;
  /* Textures are uploaded flipped, so the crop's v runs from the bottom.
     Getting this backwards puts the beard mask on his knees. */
  gl.uniform2f(U("u_crop0"), cx0 / RW, 1.0 - cy1 / RH);
  gl.uniform2f(U("u_crop1"), cx1 / RW, 1.0 - cy0 / RH);
  gl.uniform1f(U("u_loop"), loop);

  const toGL = (x, y) => [(x - cx0) / (cx1 - cx0), 1.0 - (y - cy0) / (cy1 - cy0)];
  const HAMMER = [528, 108];
  gl.uniform2fv(U("u_hammer"), toGL(...HAMMER));
  gl.uniform2fv(U("u_vent"), toGL(300, 706));

  /* ── the bolt canvas ─────────────────────────────────────────────────────
     One canvas, three channels. Drawn with 'lighter' so a wide blue pass, a
     medium green pass and a tight red pass land in R, G and B without needing
     three separate buffers. The shader then tints each independently.

     { alpha: false } is not an optimisation, it is the fix for a real bug. A
     2D canvas stores colour premultiplied by alpha, and texImage2D of a canvas
     un-premultiplies it on the way into a texture. Draw a glow at 20% alpha and
     the stored blue is 0.2 x 0.2; divide that by the 0.2 alpha and the texture
     reads full blue. Every pixel the glow touched at all came back saturated,
     which is why the halo was a flat opaque slab with a hard edge instead of a
     falloff — no amount of blurring or curve-fitting could have fixed it,
     because the values were being destroyed after the blur. An opaque canvas
     has alpha 1 everywhere, so nothing is divided and the falloff survives. */
  const BOLT = 640;
  const bc = document.createElement("canvas");
  bc.width = bc.height = BOLT;
  const bx = bc.getContext("2d", { alpha: false });

  /* 2D space is top-down, so the landmarks are converted separately. */
  const to2D = (x, y) => [
    ((x - cx0) / (cx1 - cx0)) * BOLT,
    ((y - cy0) / (cy1 - cy0)) * BOLT,
  ];
  const SCALE = BOLT / (cx1 - cx0);      // ref pixels -> bolt-canvas pixels

  /* Keep the discharge inside the picture. The hammer sits about nine percent
     below the top of the plate, so there is very little headroom above it, and
     midpoint displacement is free to throw a vertex straight out of frame — an
     arc that leaves the canvas comes back as a bolt sliced off by a hard
     straight edge, which is the one thing that reads as a bug rather than as
     weather. Clamping each vertex is enough and costs nothing visually,
     because the line is already erratic: a vertex that stops at the margin
     reads as the arc glancing off, where the same clamp on a smooth curve
     would show as a flat run. */
  const EDGE = BOLT * 0.030;
  const fit = (pts) => {
    for (const p of pts) {
      p[0] = Math.min(BOLT - EDGE, Math.max(EDGE, p[0]));
      p[1] = Math.min(BOLT - EDGE, Math.max(EDGE, p[1]));
    }
    return pts;
  };

  /* The two paths the halo grows along: out of the hammer head, over his crown,
     and down again on either side of it, so at full charge the discharge is an
     arch standing over him with its feet beside his head. The hammer is already
     higher than his crown, so these cannot arch far upward — what they do is
     span, and the span is what makes it read as "about to happen" rather than
     as a lamp. */
  const ARC_R = [HAMMER, [828, 44], [972, 424]];
  const ARC_L = [HAMMER, [338, 56], [244, 452]];

  /* Two places on him the discharge is allowed to reach. Lightning that only
     ever occupies empty sky is weather; lightning that touches the figure is
     about to happen to something. The crown tips are the tallest metal in the
     picture and the haft runs into his fist, which is exactly where a real
     discharge would go. */
  const CROWN = [[566, 232], [600, 224], [640, 222], [676, 230]];
  const FIST = [430, 145];
  function bezier(P, u) {
    const m = 1 - u;
    return [
      m * m * P[0][0] + 2 * m * u * P[1][0] + u * u * P[2][0],
      m * m * P[0][1] + 2 * m * u * P[1][1] + u * u * P[2][1],
    ];
  }

  const CYCLES = cycles;
  const CYCLE = loop / CYCLES;

  /** The slow swell. A long build, a surge, a brief peak, a snap, then rest. */
  function envelope(p) {
    if (p < 0.70) return 0.10 + 0.62 * Math.pow(p / 0.70, 2.1);
    if (p < 0.82) return 0.72 + 0.28 * ((p - 0.70) / 0.12);
    if (p < 0.86) return 1.0;
    if (p < 0.95) return 1.0 - 0.93 * Math.pow((p - 0.86) / 0.09, 0.65);
    return 0.06;
  }
  /** The discharge itself — only the few frames at the top. */
  function flash(p) {
    if (p < 0.80 || p > 0.90) return 0.0;
    return Math.sin(((p - 0.80) / 0.10) * Math.PI);
  }

  /** Steppy, not smooth. Electricity does not fade up, and a sine here is the
   *  single fastest way to make it look like a dimmer instead of a discharge.
   *  Quantised to the loop so it stays periodic. */
  const FLICK_HZ = 24;
  function flicker(t) {
    const steps = Math.round(loop * FLICK_HZ);
    const i = Math.floor((t / loop) * steps) % steps;
    return 0.58 + 0.42 * mulberry32(i * 7919 + 13)();
  }

  function drawBolts(t) {
    const tc = t % CYCLE;
    const p = tc / CYCLE;
    /* The hour reaches the generator, not only the palette. Dimming a full
       discharge leaves a full discharge that is dim; a spent storm makes
       *fewer and smaller* discharges, and that is a different picture. Scaling
       the charge here reduces the bolt count, the reach and the stroke width
       together, because all three are already functions of it. */
    const c = envelope(p) * (1.0 - 0.88 * hour_);
    const fl = flicker(t);

    bx.globalCompositeOperation = "source-over";
    bx.clearRect(0, 0, BOLT, BOLT);
    if (c < 0.02) return;

    /* Reseeded every flicker step, so the arcs are genuinely different from
       frame to frame rather than a fixed shape being brightened. */
    const step = Math.floor((t / loop) * Math.round(loop * FLICK_HZ));
    const rng = mulberry32(step * 2654435 + Math.floor(t / CYCLE) * 104729 + 7);

    const [ox, oy] = to2D(...HAMMER);
    const reach = Math.min(1, c * 1.06);          // how far along the arc
    const paths = [];

    // Radial crackle at the head. Always there once charging, and it grows.
    const near = 2 + Math.round(c * 4);
    for (let i = 0; i < near; i++) {
      const a = rng() * Math.PI * 2;
      const len = (14 + c * 46) * SCALE * (0.5 + rng());
      paths.push(fit(jag(rng, ox, oy,
        ox + Math.cos(a) * len, oy + Math.sin(a) * len,
        len * 0.42, 4)));
    }

    /* The canopy. Endpoints ride along the arc, so at low charge they sit right
       on the hammer and at full charge they are out over his crown. Two things
       are deliberate here. The arms alternate sides once there is enough charge
       to reach, because a canopy that is always denser on one side reads as an
       error rather than as a shape. And the spread of how far each arm reaches
       narrows as the charge rises — early on they scatter between short and
       medium, at the peak they nearly all go the distance, which is what makes
       the growth land as a single gesture instead of a wider scatter. */
    const arms = 1 + Math.round(c * 7);
    for (let i = 0; i < arms; i++) {
      const arc = (c > 0.45 && i % 2 === 1) ? ARC_L : ARC_R;
      /* A quadratic through a control point that high hugs the top of its span
         and only descends in the last of its parameter, so the feet of the arch
         live at u near 1. Sliding the floor up with charge is therefore what
         actually delivers the growth: at a tenth charge the arms are stubs on
         the hammer head, at full charge they run the whole span and come down
         either side of his crown. */
      const lo = 0.25 + 0.55 * c;
      const u = Math.max(0.05, reach * (lo + (1.0 - lo) * rng()));
      const [ex, ey] = bezier(arc, u);
      // Scatter, or every arm at the peak terminates on the same two points.
      const [px, py] = to2D(ex + (rng() - 0.5) * 72, ey + (rng() - 0.5) * 72);
      const dist = Math.hypot(px - ox, py - oy);
      const pts = fit(jag(rng, ox, oy, px, py, dist * 0.30, 4 + Math.round(c * 2)));
      paths.push(pts);

      // Forks off the main arc. They are what make it look like a discharge
      // finding a path rather than a drawn line.
      if (rng() < 0.30 + c * 0.55) {
        const k = 2 + Math.floor(rng() * (pts.length - 3));
        const [fx, fy] = pts[k];
        const fa = Math.atan2(py - oy, px - ox) + (rng() - 0.5) * 1.9;
        const flen = dist * (0.18 + rng() * 0.34);
        paths.push(fit(jag(rng, fx, fy,
          fx + Math.cos(fa) * flen, fy + Math.sin(fa) * flen,
          flen * 0.42, 3)));
      }
    }

    /* Crawl down the haft into his fist. It appears well before the peak,
       because the thing gripping the hammer should be the first thing the
       charge finds. */
    if (c > 0.42) {
      const [fx, fy] = to2D(...FIST);
      paths.push(fit(jag(rng, ox, oy, fx, fy, Math.hypot(fx - ox, fy - oy) * 0.34, 4)));
    }

    // And near the peak, a strike down onto a crown point.
    if (c > 0.74) {
      const tip = CROWN[Math.floor(rng() * CROWN.length)];
      const [tx, ty] = to2D(tip[0] + (rng() - 0.5) * 14, tip[1]);
      const [sx, sy] = to2D(...bezier(rng() < 0.5 ? ARC_L : ARC_R,
                                      0.30 + rng() * 0.34));
      paths.push(fit(jag(rng, sx, sy, tx, ty, Math.hypot(tx - sx, ty - sy) * 0.26, 5)));
    }

    /* At the top of the charge, one or two arcs travelling across between the
       two sides, high, over his crown. They close the arch into something ring
       shaped — this is the difference between a spray of bolts and a halo. */
    if (c > 0.66) {
      const rims = 1 + (rng() < c - 0.5 ? 1 : 0);
      for (let i = 0; i < rims; i++) {
        const uu = 0.34 + rng() * 0.30;
        const [ax, ay] = to2D(...bezier(ARC_L, uu * reach));
        const [bx2, by2] = to2D(...bezier(ARC_R, (0.34 + rng() * 0.30) * reach));
        paths.push(fit(jag(rng, ax, ay, bx2, by2,
          Math.hypot(bx2 - ax, by2 - ay) * 0.16, 5)));
      }
    }

    const trace = () => {
      bx.beginPath();
      for (const pts of paths) {
        bx.moveTo(pts[0][0], pts[0][1]);
        for (let j = 1; j < pts.length; j++) bx.lineTo(pts[j][0], pts[j][1]);
      }
      bx.stroke();
    };

    bx.globalCompositeOperation = "lighter";
    bx.lineCap = "round";
    bx.lineJoin = "round";

    const s = c * fl;
    /* B — the halo. A single stroke of the whole path set, fattened and heavily
       blurred. One stroke rather than one per polyline matters: within a single
       stroke() overlaps rasterise as one coverage mask, so a dense tangle near
       the hammer does not accumulate past the alpha it was given. The glow is
       therefore literally the bolts, blurred, which is why it is bolt shaped
       and not a disc. */
    bx.filter = `blur(${(11 + c * 19).toFixed(1)}px)`;
    bx.strokeStyle = "#0000ff";
    bx.globalAlpha = 0.34 + 0.30 * s;
    bx.lineWidth = (4.5 + c * 8) * (BOLT / 640);
    trace();
    // G — the bloom, tight to the filament.
    bx.filter = `blur(${(2.2 + c * 1.6).toFixed(1)}px)`;
    bx.strokeStyle = "#00ff00";
    bx.globalAlpha = 0.42 + 0.45 * s;
    bx.lineWidth = (2.8 + c * 1.8) * (BOLT / 640);
    trace();
    // R — the core. Sharp, thin, and the brightest thing in the frame.
    bx.filter = "none";
    bx.strokeStyle = "#ff0000";
    bx.globalAlpha = 0.74 + 0.26 * s;
    bx.lineWidth = (1.15 + c * 0.7) * (BOLT / 640);
    trace();

    bx.globalAlpha = 1;
    bx.globalCompositeOperation = "source-over";
  }

  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let debug = 0;
  let lastT = 0;

  /** Draw one frame at an absolute time. Pure: same t, same pixels. */
  function drawAt(t) {
    lastT = t;
    const tt = ((t % loop) + loop) % loop;
    const p = (tt % CYCLE) / CYCLE;
    const fl = flicker(tt);

    drawBolts(tt);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, boltTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bc);

    gl.uniform1f(U("u_debug"), debug);
    gl.uniform1f(U("u_hour"), hour_);
    gl.uniform1f(U("u_t"), tt);
    gl.uniform1f(U("u_charge"), envelope(p) * (0.7 + 0.3 * fl));
    gl.uniform1f(U("u_flash"), flash(p) * fl);
    gl.uniform1f(U("u_amp"), reduced.matches ? 0.0 : 1.0);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  let raf = 0;
  let t0 = performance.now();
  const frame = () => {
    raf = requestAnimationFrame(frame);
    drawAt((performance.now() - t0) / 1000);
  };

  return {
    drawAt,
    loop,
    get hour() { return hour_; },
    /** 0 = night storm, 1 = dawn forge. Continuous; redraws if stopped. */
    setHour(v) {
      hour_ = Math.min(1, Math.max(0, +v || 0));
      if (!raf) drawAt(lastT);
    },
    set debugMasks(v) { debug = v === 2 ? 2 : v ? 1 : 0; },
    start() { if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(frame); } },
    stop() { cancelAnimationFrame(raf); raf = 0; },
  };
}
