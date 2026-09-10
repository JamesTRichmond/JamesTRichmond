/* ============================================================================
   drive.js — "Drive", bench item one.

   The premise being tested: the guestbook already proves that a stranger on
   the internet can write to a README safely. An issue arrives, a workflow
   sanitises it, the page changes, the issue closes. Nobody is involved.

   So point that machinery at a world instead of a wall. Anyone opens an issue
   titled `move: north`. A workflow takes one step, redraws the picture, and
   closes the issue. Over days, the internet walks the robot across the floor
   to the hammer. The wonder is not the maze — it is that a document you are
   only reading is being played by people you will never meet.

   This is the prototype, not the feature. It runs the exact rules the workflow
   would run, so playing it here is the same as playing it there, and it draws
   the README frame beside the board so the thing being decided is visible.
   What it does not have is the part that is actually hard: strangers.

   No dependencies, no build step, same as everything else here.
   ========================================================================== */

const W = 13, H = 9;              // the floor, in tiles
const DIRS = {
  north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0],
};

/* Mulberry32. The maze has to be reproducible: a workflow regenerates it from
   the run number, and a prototype that shuffled on reload would be a different
   experiment every time you looked at it. */
function rng32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Recursive backtracker on the odd cells, then a handful of walls knocked out
   afterwards.

   The backtracker alone gives a perfect maze — exactly one route between any
   two points — and a perfect maze is the wrong toy for a crowd. If there is
   one route, every move is either correct or incorrect and there is nothing
   for anyone to disagree about. Knocking a few walls out afterwards creates
   loops, and loops create genuinely defensible different opinions, which is
   the entire social mechanic. It also guarantees the hammer is reachable,
   because a spanning tree reaches every cell by construction.

   Cells live at odd coordinates and the even ones between them are the walls,
   which is why the floor is 13 x 9 and not 12 x 8. */
function carve(seed) {
  const rnd = rng32(seed);
  const wall = Array.from({ length: H }, () => Array(W).fill(true));
  const stack = [[1, H - 2]];
  wall[H - 2][1] = false;

  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const opts = Object.values(DIRS)
      .map(([dx, dy]) => [x + dx * 2, y + dy * 2, x + dx, y + dy])
      .filter(([nx, ny]) => nx > 0 && ny > 0 && nx < W - 1 && ny < H - 1 && wall[ny][nx]);
    if (!opts.length) { stack.pop(); continue; }
    const [nx, ny, mx, my] = opts[Math.floor(rnd() * opts.length)];
    wall[my][mx] = false;
    wall[ny][nx] = false;
    stack.push([nx, ny]);
  }

  // The loops.
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (wall[y][x] && rnd() < 0.13) wall[y][x] = false;
    }
  }
  wall[H - 2][1] = false;
  wall[1][W - 2] = false;
  return wall;
}

const SVG = "http://www.w3.org/2000/svg";
const el = (n, a = {}) => {
  const e = document.createElementNS(SVG, n);
  for (const k in a) e.setAttribute(k, a[k]);
  return e;
};

/* The robot, reduced to the four marks that make him readable at this size:
   body, visor, antenna, bulb. Anything more is invisible at twenty pixels and
   costs a frame to draw. */
function robot() {
  const g = el("g", { class: "dr-bot" });
  g.appendChild(el("rect", { class: "dr-bot-body", x: -8.5, y: -7, width: 17, height: 14, rx: 5 }));
  g.appendChild(el("rect", { class: "dr-bot-visor", x: -5.5, y: -3, width: 11, height: 5, rx: 2.5 }));
  g.appendChild(el("line", { class: "dr-bot-ant", x1: 0, y1: -7, x2: 0, y2: -14 }));
  g.appendChild(el("circle", { class: "dr-bot-bulb", cx: 0, cy: -15.5, r: 3 }));
  return g;
}

export function mount(host) {
  const seed = 20260910;
  const wall = carve(seed);
  const state = { x: 1, y: H - 2, steps: 0, log: [], done: false };
  const GOAL = { x: W - 2, y: 1 };
  const T = 34;                      // tile size in the board's own units

  host.innerHTML = `
    <div class="dr">
      <div class="dr-board">
        <svg class="dr-svg" viewBox="0 0 ${W * T} ${H * T}" role="img"
             aria-label="A robot on a tiled floor, walking toward a hammer."></svg>
        <div class="dr-pad" role="group" aria-label="Move the robot">
          <button class="dr-key" data-dir="north">move: north</button>
          <button class="dr-key" data-dir="west">move: west</button>
          <button class="dr-key" data-dir="south">move: south</button>
          <button class="dr-key" data-dir="east">move: east</button>
        </div>
        <p class="dr-hint">Arrow keys work too. Each press is one issue.</p>
      </div>

      <div class="dr-side">
        <div class="dr-readme">
          <span class="dr-readme-tag">what the README would show</span>
          <pre class="dr-frame" aria-live="polite"></pre>
        </div>
        <ol class="dr-log" aria-live="polite"></ol>
      </div>
    </div>`;

  const svg = host.querySelector(".dr-svg");
  const frame = host.querySelector(".dr-frame");
  const log = host.querySelector(".dr-log");

  /* ── the floor ─────────────────────────────────────────────────────────
     Drawn once. Only the robot moves, so there is no reason to touch the
     other hundred and seventeen tiles ever again. */
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      svg.appendChild(el("rect", {
        class: wall[y][x] ? "dr-wall" : "dr-floor",
        x: x * T, y: y * T, width: T + 0.5, height: T + 0.5,
      }));
    }
  }

  // The hammer, because he ought to be walking toward something that is
  // already in this world rather than a generic exit.
  const goal = el("g", {
    class: "dr-goal",
    transform: `translate(${GOAL.x * T + T / 2} ${GOAL.y * T + T / 2})`,
  });
  goal.appendChild(el("rect", { class: "dr-goal-head", x: -9, y: -8, width: 18, height: 10, rx: 2 }));
  goal.appendChild(el("rect", { class: "dr-goal-haft", x: -1.6, y: 1, width: 3.2, height: 12, rx: 1.6 }));
  svg.appendChild(goal);

  const bot = robot();
  svg.appendChild(bot);

  const place = () => {
    bot.setAttribute("transform",
      `translate(${state.x * T + T / 2} ${state.y * T + T / 2})`);
  };
  place();

  /* ── the README frame ──────────────────────────────────────────────────
     Monospace, because that is what survives a README. The real thing renders
     an image; this is the same information in the cheapest possible form,
     which is the right level of detail for deciding whether the idea works. */
  function draw() {
    const rows = [];
    for (let y = 0; y < H; y++) {
      let line = "";
      for (let x = 0; x < W; x++) {
        if (x === state.x && y === state.y) line += "▟▙";
        else if (x === GOAL.x && y === GOAL.y) line += "╤╤";
        else line += wall[y][x] ? "██" : "· ";
      }
      rows.push(line);
    }
    const last = state.log[0];
    rows.push("");
    rows.push(state.done
      ? `he made it in ${state.steps} steps — new floor tomorrow`
      : `${state.steps} steps · last move ${last ? `${last.dir} by ${last.who}` : "—"}`);
    frame.textContent = rows.join("\n");
  }

  function note(dir, who, outcome) {
    state.log.unshift({ dir, who, outcome });
    state.log.length = Math.min(state.log.length, 7);
    log.innerHTML = state.log.map((e) => `
      <li class="dr-log-row${e.outcome === "wall" ? " is-blocked" : ""}">
        <span class="dr-who">@${e.who}</span>
        <span class="dr-move">move: ${e.dir}</span>
        <span class="dr-out">${e.outcome === "wall" ? "wall" : "ok"}</span>
      </li>`).join("");
  }

  function step(dir) {
    if (state.done || !DIRS[dir]) return;
    const [dx, dy] = DIRS[dir];
    const nx = state.x + dx, ny = state.y + dy;
    const blocked = nx < 0 || ny < 0 || nx >= W || ny >= H || wall[ny][nx];

    /* A blocked move still counts as a turn. That is deliberate and it is the
       whole anti-grief posture: walking him into a wall costs the griefer an
       issue and achieves nothing, so there is no reward in it. */
    state.steps++;
    if (blocked) {
      bot.classList.remove("is-bump");
      void bot.offsetWidth;
      bot.classList.add("is-bump");
      bot.style.setProperty("--bx", dx);
      bot.style.setProperty("--by", dy);
      note(dir, "you", "wall");
    } else {
      state.x = nx; state.y = ny;
      place();
      note(dir, "you", "ok");
      if (nx === GOAL.x && ny === GOAL.y) {
        state.done = true;
        host.querySelector(".dr").classList.add("is-done");
      }
    }
    draw();
  }

  host.querySelectorAll(".dr-key").forEach((b) => {
    b.addEventListener("click", () => step(b.dataset.dir));
  });

  /* Only while the exhibit has focus. A page that swallows the arrow keys is
     a page you cannot scroll. */
  const board = host.querySelector(".dr-board");
  board.tabIndex = 0;
  board.addEventListener("keydown", (e) => {
    const k = { ArrowUp: "north", ArrowDown: "south", ArrowLeft: "west", ArrowRight: "east" }[e.key];
    if (!k) return;
    e.preventDefault();
    step(k);
  });

  draw();
}
