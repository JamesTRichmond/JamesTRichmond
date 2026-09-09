/* ============================================================================
   agentloop.js — one agent loop, stepped by hand.

   The task is small and real: find out why a deploy failed. The point of the
   exhibit is turn four, where the search tool succeeds and returns nothing,
   and a loop that treats "ran without error" as "found something" writes a
   confident summary of an empty result.

   Both branches are here. The reader picks which loop they are running.
   ========================================================================== */

/* Every turn is: what the model decided, what it called, what came back. */
const TURNS = [
  {
    think: "The deploy for build 4471 failed. I don't know anything else yet. Start with the log.",
    tool: "read_logs",
    args: { build: "4471", tail: 200 },
    result: "…\n[14:02:11] step 6/9  bundling assets\n[14:02:19] step 7/9  running migrations\n[14:02:19] ERROR  relation \"user_prefs\" does not exist\n[14:02:19] exit 1",
    kind: "ok",
    note: "A real error, at a real step. Nothing subtle yet.",
  },
  {
    think: "A migration expected a table that isn't there. Either the migration never ran, or it ran somewhere else. Check what the database thinks.",
    tool: "list_migrations",
    args: { env: "staging" },
    result: "0041_add_sessions      applied  2026-08-29\n0042_add_user_prefs    PENDING\n0043_backfill_prefs    PENDING",
    kind: "ok",
    note: "0042 is pending. That looks like the answer, and this is exactly where a loop wants to stop.",
  },
  {
    think: "0042 is pending. But 0043 depends on it and is also pending, so 'run 0042' may not be the whole fix. Check whether 0042 has ever succeeded anywhere.",
    tool: "list_migrations",
    args: { env: "production" },
    result: "0041_add_sessions      applied  2026-08-29\n0042_add_user_prefs    FAILED   2026-09-02\n0043_backfill_prefs    PENDING",
    kind: "ok",
    note: "It didn't just never run. It ran in production and failed. The staging failure is a symptom.",
  },
  {
    think: "Why did 0042 fail in production? Search the incident channel for it.",
    tool: "search_incidents",
    args: { q: "0042_add_user_prefs" },
    result: "[]",
    kind: "empty",
    note: "The tool ran perfectly. It returned nothing. This is turn four, and this is where loops go wrong.",
    fork: {
      naive: {
        think: "The search came back. No incidents found — so this was never escalated. I have enough to report.",
        out: "**Root cause:** migration 0042 is pending in staging and was never escalated as an incident. **Fix:** run the pending migrations.",
        verdict: "wrong",
        why: "Every sentence is fluent, and the conclusion is backwards. 'No incidents found' was read as 'nothing went wrong', when the tool had simply been asked the wrong question. The report is confident, cheap to produce, and would have sent someone to run a migration that already failed once.",
      },
      careful: {
        think: "Empty is not the same as absent. Either nothing was filed, or my query was wrong. The incident search may not index migration filenames — try the table name instead.",
        tool: "search_incidents",
        args: { q: "user_prefs" },
        result: "INC-2291  \"prefs migration locks users table\"  status: mitigated\n  → 0042 rolled back in prod after a 40s lock on users",
        verdict: "right",
        why: "The same tool, the same day, a different query. The migration is not missing — it was deliberately rolled back because it takes a long lock. Running it in staging is not the fix; it is a repeat of the outage.",
        out: "**Root cause:** 0042 acquires a long lock on `users` and was rolled back in production (INC-2291). Staging is failing because it was never re-applied. **Fix:** the migration needs rewriting to take the lock concurrently — not re-running.",
      },
    },
  },
];

const CSS = `
.al { display:grid; grid-template-columns: minmax(0,1fr) minmax(0,1.1fr); gap: clamp(1rem,3vw,1.8rem); align-items:start; }
@media (width < 56rem) { .al { grid-template-columns: minmax(0,1fr); } }

.al-diagram { display:block; inline-size:100%; block-size:auto; }
.al-node { fill: var(--raised); stroke: var(--line); stroke-width:1.5; transition: fill .2s, stroke .2s; }
.al-node.on { fill: color-mix(in oklab, var(--sub) 40%, var(--raised)); stroke: var(--sub); }
.al-t { fill: var(--ink-dim); font-family: var(--font-mono); font-size:12px; text-anchor:middle; }
.al-node.on + .al-t, .al-t.on { fill: var(--ink); }
.al-arrow { stroke: var(--line); stroke-width:2; fill:none; }
.al-arrow.on { stroke: var(--sub); }

.al-bar { display:flex; flex-wrap:wrap; gap:.4rem; align-items:center; margin-block-start:1rem; }
.al-btn { font-family: var(--font-mono); font-size:.74rem; font-weight:600; padding:.42rem .95rem;
  border-radius:999px; border:1px solid transparent; background: var(--sub); color: var(--sub-on); cursor:pointer; }
.al-btn:disabled { opacity:.45; cursor:default; }
.al-ghost { font-family: var(--font-mono); font-size:.72rem; padding:.4rem .8rem; border-radius:999px;
  border:1px solid var(--line); background:transparent; color: var(--ink-dim); cursor:pointer; }
.al-ghost:hover { color: var(--ink); border-color: var(--sub); }
.al-count { font-family: var(--font-mono); font-size:.72rem; color: var(--ink-dim); margin-inline-start:auto; }

.al-tape { max-block-size: 30rem; overflow-y:auto; padding-inline-end:.4rem; }
.al-turn { border-inline-start:2px solid var(--line); padding:0 0 1.1rem 1rem; }
.al-turn.live { border-color: var(--sub); }
.al-turn.bad { border-color: var(--sub-2); }
.al-turn.good { border-color: var(--fluoro); }
.al-role { font-family: var(--font-mono); font-size:.66rem; letter-spacing:.12em; text-transform:uppercase;
  color: var(--ink-dim); margin-block:0 .3rem; }
.al-think { margin:0 0 .7rem; font-size:.88rem; line-height:1.6; color: var(--ink); text-wrap:pretty; }
.al-call, .al-res { margin:0 0 .55rem; font-family: var(--font-mono); font-size:.73rem; line-height:1.6;
  background: var(--bg-deep); border:1px solid var(--line); border-radius: var(--radius-sm);
  padding:.5rem .65rem; white-space:pre-wrap; overflow-wrap:anywhere; color: var(--ink-dim); }
.al-call { color: var(--sub); }
.al-res.empty { color: var(--sub-2); }
.al-note { margin:0; font-size:.82rem; line-height:1.6; color: var(--ink-dim); font-style:italic; text-wrap:pretty; }

.al-fork { margin-block-start:.8rem; display:flex; flex-wrap:wrap; gap:.4rem; }
.al-out { margin:.6rem 0 0; font-size:.86rem; line-height:1.6; color: var(--ink); text-wrap:pretty; }
.al-why { margin:.6rem 0 0; font-size:.83rem; line-height:1.6; color: var(--ink-dim); text-wrap:pretty; }
.al-verdict { font-family: var(--font-mono); font-size:.7rem; letter-spacing:.08em; text-transform:uppercase; }
.al-verdict.wrong { color: var(--sub-2); }
.al-verdict.right { color: var(--fluoro); }
`;

const STAGES = [
  { id: "think", label: "decide", cx: 90 },
  { id: "act", label: "call a tool", cx: 250 },
  { id: "observe", label: "read it", cx: 410 },
];

function node(tag, attrs = {}, text) {
  const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text != null) n.textContent = text;
  return n;
}

export function mount(root) {
  const style = document.createElement("style");
  style.textContent = CSS;
  root.append(style);

  const wrap = document.createElement("div");
  wrap.className = "al";
  wrap.innerHTML = `
    <div>
      <svg class="al-diagram" viewBox="0 0 500 190" role="img"
           aria-label="A loop: decide, call a tool, read the result, and back to decide.">
      </svg>
      <div class="al-bar">
        <button type="button" class="al-btn">Step</button>
        <button type="button" class="al-ghost">Start over</button>
        <span class="al-count"></span>
      </div>
    </div>
    <div class="al-tape" aria-live="polite"></div>`;
  root.append(wrap);

  const s = wrap.querySelector(".al-diagram");
  const tape = wrap.querySelector(".al-tape");
  const stepBtn = wrap.querySelector(".al-btn");
  const resetBtn = wrap.querySelector(".al-ghost");
  const count = wrap.querySelector(".al-count");

  const nodes = {};
  for (const st of STAGES) {
    const r = node("rect", { class: "al-node", x: st.cx - 62, y: 40, width: 124, height: 54, rx: 10 });
    const t = node("text", { class: "al-t", x: st.cx, y: 72 }, st.label);
    s.append(r, t);
    nodes[st.id] = { r, t };
  }
  const a1 = node("path", { class: "al-arrow", d: "M152 67h34l-8-6m8 6-8 6" });
  const a2 = node("path", { class: "al-arrow", d: "M312 67h34l-8-6m8 6-8 6" });
  const back = node("path", { class: "al-arrow", d: "M410 94v34H90V100l-6 8m6-8 6 8" });
  s.append(a1, a2, back);
  s.append(node("text", { class: "al-t", x: "250", y: "152" }, "…until a stopping rule says otherwise"));

  let i = 0;
  let branch = null;   // "naive" | "careful", once the fork is taken
  let done = false;

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function callLine(tool, args) {
    return `${tool}(${Object.entries(args).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(", ")})`;
  }

  function light(stage) {
    for (const st of STAGES) {
      nodes[st.id].r.classList.toggle("on", st.id === stage);
      nodes[st.id].t.classList.toggle("on", st.id === stage);
    }
    a1.classList.toggle("on", stage === "act");
    a2.classList.toggle("on", stage === "observe");
    back.classList.toggle("on", stage === "think" && i > 0);
  }

  function renderTurn(t, n) {
    const box = el("div", "al-turn live");
    box.append(el("p", "al-role", `Turn ${n}`));
    box.append(el("p", "al-think", t.think));
    box.append(el("pre", "al-call", "→ " + callLine(t.tool, t.args)));
    box.append(el("pre", `al-res${t.kind === "empty" ? " empty" : ""}`,
      "← " + (t.kind === "empty" ? "[]   (ran fine. found nothing.)" : t.result)));
    box.append(el("p", "al-note", t.note));
    return box;
  }

  function offerFork(t) {
    const box = el("div", "al-turn live");
    box.append(el("p", "al-role", "Turn 5 — the loop decides again"));
    box.append(el("p", "al-think",
      "Two loops would do two different things with an empty result. Pick one."));
    const row = el("div", "al-fork");

    for (const [key, label] of [["naive", "Treat empty as an answer"], ["careful", "Treat empty as a question"]]) {
      const b = el("button", "al-ghost", label);
      b.type = "button";
      b.addEventListener("click", () => {
        branch = key;
        box.remove();
        renderBranch(t.fork[key]);
        done = true;
        stepBtn.disabled = true;
        count.textContent = branch === "careful" ? "6 turns · correct" : "5 turns · confidently wrong";
      });
      row.append(b);
    }
    box.append(row);
    tape.append(box);
    tape.scrollTop = tape.scrollHeight;
  }

  function renderBranch(f) {
    const box = el("div", `al-turn ${f.verdict === "right" ? "good" : "bad"}`);
    box.append(el("p", "al-role", f.verdict === "right" ? "Turn 5 — kept going" : "Turn 5 — stopped"));
    box.append(el("p", "al-think", f.think));
    if (f.tool) {
      box.append(el("pre", "al-call", "→ " + callLine(f.tool, f.args)));
      box.append(el("pre", "al-res", "← " + f.result));
    }
    const v = el("p", `al-role al-verdict ${f.verdict}`,
      f.verdict === "right" ? "answer" : "answer — and it is wrong");
    box.append(v);
    box.append(el("p", "al-out", f.out.replace(/\*\*/g, "")));
    box.append(el("p", "al-why", f.why));
    tape.append(box);
    light("think");
    tape.scrollTop = tape.scrollHeight;
  }

  function step() {
    if (done) return;
    if (i >= TURNS.length) return;
    const t = TURNS[i];
    for (const prev of tape.querySelectorAll(".al-turn.live")) prev.classList.remove("live");
    tape.append(renderTurn(t, i + 1));
    light("observe");
    i += 1;
    count.textContent = `${i} turn${i === 1 ? "" : "s"}`;
    tape.scrollTop = tape.scrollHeight;
    if (i === TURNS.length) {
      stepBtn.disabled = true;
      offerFork(t);
    }
  }

  function reset() {
    i = 0; branch = null; done = false;
    tape.replaceChildren();
    stepBtn.disabled = false;
    count.textContent = "0 turns";
    light("think");
    const intro = el("div", "al-turn");
    intro.append(el("p", "al-role", "The task"));
    intro.append(el("p", "al-think", "“The staging deploy for build 4471 failed. Find out why.”"));
    intro.append(el("p", "al-note", "Four tools available: read_logs, list_migrations, search_incidents, post_summary."));
    tape.append(intro);
  }

  stepBtn.addEventListener("click", step);
  resetBtn.addEventListener("click", reset);
  reset();
}
