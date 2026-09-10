# Decisions

Dated, with reasoning. Newest first. A decision belongs here when reversing it
would cost real work, or when a future reader would otherwise assume it was an
accident.

Entries marked *(backfilled)* were made before this log existed and are recorded
from the state of the repo and the project notes, not from a contemporaneous
record.

---

## 2026-09-10 — A workshop page, public and linked

`/workshop/` is a seventh room, in the site nav, open to anyone.

The alternative was an unlisted scratch page plus a separate public showcase.
Rejected because the separation costs two pages of upkeep and throws away the
only genuinely unusual thing about the idea: almost nobody publishes the state
their work was in the day before it worked. A room that is openly unfinished is
a stronger exhibit than a second polished one.

**What it costs:** a visitor may form an impression from something half-built.
Mitigated by saying so in the first paragraph and marking every unfinished thing
in the frame as well as the text, so nobody has to read to find out.

## 2026-09-10 — Project demos run in the browser, not on video

A tile on the workshop wall is a live, standalone, client-side rebuild of the
thing — like the six existing exhibits — not a recorded loop or a screenshot.

Costs much more per project, and some features will not survive the port to
"no backend." Accepted because a visitor who *played with it* has a different
relationship to the work than one who watched a video of someone else playing
with it, and that difference is the entire reason the six rooms work.

## 2026-09-10 — First bench item: Drive

The play-by-issue prototype, ahead of the day/night portrait, the per-request
flipbook and the parallax engraving. Chosen because the guestbook already proves
the hard part is safe, so this is the shortest path from proven machinery to a
genuinely new reaction — and because the unsolved parts of it (rate limiting,
concurrency, committing a binary several times a day) are worth having in front
of us early rather than late.

## Standing decisions *(backfilled)*

- **Hosting.** GitHub Pages off `JamesTRichmond/JamesTRichmond`, `main` branch
  root, legacy build with `.nojekyll`. Custom domain pinned by `CNAME` — do not
  delete that file; removing it has broken HTTPS on the domain before.
- **No dependencies, no build step.** Every page is static HTML, hand-written
  CSS in cascade layers, and ES modules loaded directly. The cost is that
  nothing can be `npm install`ed; the benefit is that the repo will still build
  in five years, and that a reader can view-source and actually learn something.
- **The engine is vendored, not linked.** The robot lives canonically at
  `JamesTRichmond/habitat`; this site keeps its own copy under `assets/js/` and
  `assets/habitat/`. Deliberate: the alternative was a personal site with a
  runtime dependency on a CDN.
- **Git runs outside the mounted folder.** The working clone is at
  `~/work/profile`. Git inside the connected folder fails on lock files it is
  not permitted to unlink.
