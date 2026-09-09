/* ============================================================================
   dbq.js — a document-based question, compressed to its load-bearing move.

   Both sources are unambiguously public domain (1889 and 1892) and are quoted
   short, the way they appear on an actual exam.

   The design decision that matters: every wrong answer is wrong in a named,
   teachable way, and the reader is told which way after they pick. That is the
   difference between a quiz and a lesson. A quiz tells you that you were
   wrong; this tells you what kind of wrong, and the kinds repeat forever.
   ========================================================================== */

const DOCS = [
  {
    cite: "Andrew Carnegie, “Wealth,” North American Review, June 1889",
    text:
      "This, then, is held to be the duty of the man of wealth: to set an " +
      "example of modest, unostentatious living, shunning display; to provide " +
      "moderately for the legitimate wants of those dependent upon him; and, " +
      "after doing so, to consider all surplus revenues which come to him " +
      "simply as trust funds, which he is called upon to administer.",
    claims: [
      {
        t: "Carnegie held that the wealthy themselves should decide how surplus wealth is spent for the public good.",
        ok: true,
        why:
          "This is what the passage says and no more than what it says. The word doing the work is “administer” — he is not proposing to give the money away so much as to keep deciding about it.",
      },
      {
        t: "Carnegie supported higher taxes on the rich to fund public works.",
        kind: "Not in the document",
        why:
          "It might be true, it might not, but you cannot get there from these five lines — taxes are never mentioned. This is the most common way a confident student loses the point: the claim is about the author, not about the evidence in front of them.",
      },
      {
        t: "Carnegie's workers agreed with his view of wealth.",
        kind: "Nobody in the document said this",
        why:
          "The document has exactly one voice in it, and it belongs to Carnegie. A source tells you what its author wanted a reader to believe. It does not tell you what anybody else thought, and treating it as though it does is how a single voice becomes “people at the time believed…”.",
      },
      {
        t: "Carnegie believed large fortunes were unjust and should not exist.",
        kind: "Backwards",
        why:
          "The passage takes the fortune entirely for granted and argues only about what to do with it afterward. Reversing an author's position is easier than it sounds when the language is high-minded enough to sound like a critique.",
      },
    ],
  },
  {
    cite: "Omaha Platform of the People's Party, July 1892",
    text:
      "We meet in the midst of a nation brought to the verge of moral, " +
      "political, and material ruin. Corruption dominates the ballot-box, the " +
      "Legislatures, the Congress… The fruits of the toil of millions are " +
      "boldly stolen to build up colossal fortunes for a few.",
    claims: [
      {
        t: "The Populists argued that concentrated wealth had captured the institutions of government.",
        ok: true,
        why:
          "Ballot-box, legislatures, Congress, and then colossal fortunes, in that order, in one breath. The document draws the line itself; you are only reading it out loud.",
      },
      {
        t: "The Populist movement opposed democratic government.",
        kind: "Backwards",
        why:
          "They are furious that democracy has been corrupted, which is the opposite of wanting less of it. A source's anger is not the same as its target, and students mix those up constantly.",
      },
      {
        t: "Farm foreclosures rose sharply across the Plains in the early 1890s.",
        kind: "True, but not from this",
        why:
          "This is the hardest one, because it is correct and it is relevant and a good essay might well use it. It just is not <em>in this document</em>, and on a document-based question that distinction is the entire assignment.",
      },
      {
        t: "The People's Party won the presidential election of 1892.",
        kind: "Not true, and not here either",
        why:
          "They did not, and the platform could not tell you either way — it was written before the election. A document cannot testify about events that had not happened when it was written, which is a check worth running on every source, every time.",
      },
    ],
  },
];

const CSS = `
.dbq-doc { border:1px solid var(--line); border-radius: var(--radius-sm); background: var(--bg-deep);
  padding: clamp(.9rem,2.5vw,1.3rem); margin-block-end:1.2rem; }
.dbq-src { margin:0 0 .7rem; font-family: var(--font-mono); font-size:.68rem; letter-spacing:.08em;
  text-transform: uppercase; color: var(--ink-dim); }
.dbq-text { margin:0; font-size:1rem; line-height:1.72; color: var(--ink); text-wrap:pretty; }

.dbq-q { margin:0 0 .8rem; font-size:.88rem; color: var(--ink-dim); }
.dbq-list { list-style:none; margin:0; padding:0; display:grid; gap:.5rem; }
.dbq-btn {
  inline-size:100%; text-align:start; font: inherit; font-size:.9rem; line-height:1.55;
  color: var(--ink); background: color-mix(in oklab, var(--surface) 55%, transparent);
  border:1px solid var(--line); border-radius: var(--radius-sm); padding:.75rem .9rem;
  cursor:pointer; transition: border-color .16s, background .16s;
}
.dbq-btn:hover:not(:disabled) { border-color: var(--sub); }
.dbq-btn:disabled { cursor:default; }
.dbq-btn.right { border-color: var(--fluoro); background: color-mix(in oklab, var(--fluoro) 12%, transparent); }
.dbq-btn.wrong { border-color: var(--sub-2); background: color-mix(in oklab, var(--sub-2) 10%, transparent); }
.dbq-btn.faded { opacity:.45; }

.dbq-tag { display:block; font-family: var(--font-mono); font-size:.66rem; letter-spacing:.1em;
  text-transform: uppercase; margin-block-end:.3rem; }
.dbq-tag.right { color: var(--fluoro); }
.dbq-tag.wrong { color: var(--sub-2); }

.dbq-why { margin:1rem 0 0; padding-inline-start:1rem; border-inline-start:2px solid var(--sub);
  font-size:.88rem; line-height:1.65; color: var(--ink-dim); text-wrap:pretty; }

.dbq-bar { display:flex; flex-wrap:wrap; align-items:center; gap:.5rem; margin-block-start:1.2rem; }
.dbq-next { font-family: var(--font-mono); font-size:.74rem; font-weight:600; padding:.42rem .95rem;
  border-radius:999px; border:1px solid transparent; background: var(--sub); color: var(--sub-on); cursor:pointer; }
.dbq-next[hidden] { display:none; }
.dbq-again { font-family: var(--font-mono); font-size:.72rem; padding:.4rem .8rem; border-radius:999px;
  border:1px solid var(--line); background:transparent; color: var(--ink-dim); cursor:pointer; }
.dbq-again:hover { color: var(--ink); border-color: var(--sub); }
.dbq-prog { font-family: var(--font-mono); font-size:.72rem; color: var(--ink-dim); margin-inline-start:auto; }
`;

export function mount(root) {
  const style = document.createElement("style");
  style.textContent = CSS;
  root.append(style);

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="dbq-doc">
      <p class="dbq-src"></p>
      <p class="dbq-text"></p>
    </div>
    <p class="dbq-q">Which of these does the document actually support?</p>
    <ul class="dbq-list"></ul>
    <p class="dbq-why" hidden></p>
    <div class="dbq-bar">
      <button type="button" class="dbq-next" hidden>Next document</button>
      <button type="button" class="dbq-again">Start over</button>
      <span class="dbq-prog"></span>
    </div>`;
  root.append(wrap);

  const src = wrap.querySelector(".dbq-src");
  const text = wrap.querySelector(".dbq-text");
  const list = wrap.querySelector(".dbq-list");
  const why = wrap.querySelector(".dbq-why");
  const next = wrap.querySelector(".dbq-next");
  const again = wrap.querySelector(".dbq-again");
  const prog = wrap.querySelector(".dbq-prog");

  let d = 0;

  /** Shuffled per render, so the correct answer is never in a fixed place —
   *  which is a thing students find out and then stop reading for. */
  function shuffled(claims) {
    const a = claims.map((c, i) => ({ c, i }));
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a.map((x) => x.c);
  }

  function render() {
    const doc = DOCS[d];
    src.textContent = doc.cite;
    text.textContent = `“${doc.text}”`;
    why.hidden = true;
    next.hidden = true;
    prog.textContent = `Document ${d + 1} of ${DOCS.length}`;
    list.replaceChildren();

    const buttons = [];
    for (const claim of shuffled(doc.claims)) {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "dbq-btn";
      b.textContent = claim.t;
      b.addEventListener("click", () => answer(claim, b, buttons));
      li.append(b);
      list.append(li);
      buttons.push({ b, claim });
    }
  }

  function answer(claim, btn, buttons) {
    for (const { b, claim: c } of buttons) {
      b.disabled = true;
      if (c.ok) {
        b.classList.add("right");
        b.prepend(tag("The document supports this", "right"));
      } else if (b === btn) {
        b.classList.add("wrong");
        b.prepend(tag(c.kind, "wrong"));
      } else {
        b.classList.add("faded");
      }
    }
    why.hidden = false;
    why.innerHTML = claim.ok
      ? `<strong style="color:var(--ink)">Yes.</strong> ${claim.why}`
      : `<strong style="color:var(--ink)">${claim.kind}.</strong> ${claim.why}`;
    next.hidden = d >= DOCS.length - 1;
    why.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function tag(t, cls) {
    const s = document.createElement("span");
    s.className = `dbq-tag ${cls}`;
    s.textContent = t;
    return s;
  }

  next.addEventListener("click", () => { d = Math.min(d + 1, DOCS.length - 1); render(); });
  again.addEventListener("click", () => { d = 0; render(); });
  render();
}
