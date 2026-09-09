/* ============================================================================
   tsinfer.js — type-level route parsing, evaluated live.

   TypeScript's type system is a pure functional language that runs at compile
   time. Given a route string it can read the string, character by character,
   and hand back an object type of the parameters in it.

   The right-hand panel here is not a screenshot and it is not hard-coded: the
   same recursive rule the type uses is implemented in JavaScript below, so
   editing the route re-derives the type the same way tsc would. Where the two
   could disagree they are commented.
   ========================================================================== */

const SOURCE = `type Params<S extends string> =
  S extends \`\${string}:\${infer P}/\${infer R}\`
    ? { [K in P | keyof Params<\`/\${R}\`>]: string }
  : S extends \`\${string}:\${infer P}\`
    ? { [K in P]: string }
  : {};

type R = Params<"__ROUTE__">;`;

/** The same recursion the conditional type performs, in JavaScript.
 *  TypeScript's `infer P` before a `/` is non-greedy in exactly this way. */
function paramsOf(route) {
  const out = [];
  let rest = route;
  for (;;) {
    const colon = rest.indexOf(":");
    if (colon === -1) break;
    rest = rest.slice(colon + 1);
    const slash = rest.indexOf("/");
    const name = slash === -1 ? rest : rest.slice(0, slash);
    if (name) out.push(name);
    if (slash === -1) break;
    rest = rest.slice(slash);
  }
  // A duplicate parameter collapses in the union, exactly as `P | keyof …`
  // would: `:id/:id` is one key, not two. Order of first appearance is kept.
  return [...new Set(out)];
}

const PRESETS = [
  "/users/:id",
  "/users/:userId/posts/:postId",
  "/orgs/:org/repos/:repo/issues/:number",
  "/static/favicon.ico",
  "/a/:x/b/:x",
];

const CSS = `
.ts { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(1rem,3vw,1.9rem); align-items: start; }
@media (width < 54rem) { .ts { grid-template-columns: minmax(0,1fr); } }

.ts-lab { display:block; font-family: var(--font-mono); font-size:.68rem; letter-spacing:.1em;
  text-transform: uppercase; color: var(--ink-dim); margin-block-end:.4rem; }
.ts-route {
  inline-size:100%; font-family: var(--font-mono); font-size:1rem; color: var(--sub);
  background: var(--bg-deep); border:1px solid var(--line); border-radius: var(--radius-sm);
  padding:.65rem .8rem;
}
.ts-route:focus-visible { outline:2px solid var(--sub); outline-offset:2px; }

.ts-presets { display:flex; flex-wrap:wrap; gap:.3rem; margin-block:.7rem 1.2rem; }
.ts-preset { font-family: var(--font-mono); font-size:.68rem; padding:.3rem .6rem; border-radius:999px;
  border:1px solid var(--line); background: transparent; color: var(--ink-dim); cursor:pointer; }
.ts-preset:hover { color: var(--ink); border-color: var(--sub); }

.ts-code, .ts-out {
  margin:0; background: var(--bg-deep); border:1px solid var(--line); border-radius: var(--radius-sm);
  padding:.85rem .95rem; font-family: var(--font-mono); font-size:.78rem; line-height:1.65;
  overflow-x:auto; color: var(--ink-dim); white-space: pre;
}
.ts-out { color: var(--ink); }
.ts-k { color: var(--sub-2); }
.ts-s { color: var(--fluoro); }
.ts-p { color: var(--sub); font-weight:600; }
.ts-c { color: var(--ink-dim); opacity:.75; }

.ts-usage { margin-block-start:1rem; }
.ts-usage-l { font-family: var(--font-mono); font-size:.68rem; letter-spacing:.1em;
  text-transform: uppercase; color: var(--ink-dim); margin-block:0 .45rem; }
.ts-err { color: var(--sub-2); }
.ts-ok { color: var(--fluoro); }
`;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * One pass, not a chain of .replace() calls.
 *
 * Chaining them looks fine and is quietly broken: the keyword pass emits
 * `<span class="ts-k">`, and the string pass that runs next sees the `"ts-k"`
 * inside that markup as a string literal and wraps it again. The result is
 * `"ts-k">type` printed on screen, which is precisely what this exhibit was
 * doing. A single regex with alternation never sees its own output, so the two
 * rules cannot collide.
 */
const TOKENS = /("[^"]*")|\b(type|extends|infer|keyof)\b/g;

function highlight(src) {
  let out = "";
  let last = 0;
  for (const m of src.matchAll(TOKENS)) {
    out += esc(src.slice(last, m.index));
    const cls = m[1] ? "ts-s" : "ts-k";
    out += `<span class="${cls}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return out + esc(src.slice(last));
}

export function mount(root) {
  const style = document.createElement("style");
  style.textContent = CSS;
  root.append(style);

  const wrap = document.createElement("div");
  wrap.className = "ts";
  wrap.innerHTML = `
    <div>
      <label class="ts-lab" for="ts-route">The route — edit it</label>
      <input class="ts-route" id="ts-route" type="text" spellcheck="false" autocomplete="off">
      <div class="ts-presets" role="group" aria-label="Example routes"></div>
      <label class="ts-lab">The type that reads it</label>
      <pre class="ts-code"></pre>
    </div>
    <div aria-live="polite">
      <label class="ts-lab">What tsc infers</label>
      <pre class="ts-out"></pre>
      <div class="ts-usage">
        <p class="ts-usage-l">And therefore, at every call site</p>
        <pre class="ts-out ts-usage-body"></pre>
      </div>
    </div>`;
  root.append(wrap);

  const input = wrap.querySelector("#ts-route");
  const presets = wrap.querySelector(".ts-presets");
  const code = wrap.querySelector(".ts-code");
  const out = wrap.querySelector(".ts-out");
  const usage = wrap.querySelector(".ts-usage-body");

  for (const p of PRESETS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ts-preset";
    b.textContent = p;
    b.addEventListener("click", () => { input.value = p; render(); });
    presets.append(b);
  }

  function render() {
    const route = input.value;
    const keys = paramsOf(route);

    code.innerHTML = highlight(SOURCE.replace("__ROUTE__", route));

    if (!keys.length) {
      out.innerHTML =
        `<span class="ts-k">type</span> R = {}   <span class="ts-c">// no parameters in that route</span>`;
      usage.innerHTML =
        `<span class="ts-c">// nothing to read, and nothing that can go stale</span>`;
      return;
    }

    const body = keys.map((k) => `  <span class="ts-p">${esc(k)}</span>: string;`).join("\n");
    out.innerHTML = `<span class="ts-k">type</span> R = {\n${body}\n}`;

    const first = keys[0];
    const wrong = first === "id" ? "userId" : "id";
    usage.innerHTML =
      `params.<span class="ts-p">${esc(first)}</span>   <span class="ts-ok">// string ✓</span>\n` +
      `params.<span class="ts-p">${esc(wrong)}</span>   <span class="ts-err">// Property '${esc(wrong)}' does not exist ✗</span>\n\n` +
      `<span class="ts-c">// Rename the parameter above and this flips,\n` +
      `// in every file, before anything runs.</span>`;
  }

  input.addEventListener("input", render);
  input.value = PRESETS[1];
  render();
}
