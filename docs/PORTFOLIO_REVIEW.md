# Portfolio independent review

Reviewed 2026-11-04 against the integrated Personal Website sprint checkout.
Repository: `JamesTRichmond/JamesTRichmond`. Policy consulted: `DECISIONS.md`
and `README.md`. The review preserved the no-dependency/no-build architecture
and did not change domain configuration, existing robot work, or deployments.

## Verified by this reviewer

- `python3 scripts/validate_portfolio.py --all-public`: **11 public HTML pages,
  275 references, zero errors**. This checks local link and asset existence,
  fragment targets, duplicate IDs, referenced ARIA IDs, image alt presence,
  document metadata, main landmarks, and skipped heading levels. It does not
  establish complete accessibility conformance.
- `node --test tests/fall-in.test.mjs`: **14 passing tests** in the integrated
  checkout. Tests cover deterministic geometry/time, exact phase transitions,
  repeatable starts, idle scheduling, reduced-motion still views, pause and
  resume, hidden/offscreen suspension, and disposal/remount behavior.
- `PORTFOLIO_ROOT=<integration-checkout> node --test
  tests/portfolio-static.test.mjs`: **8 passing tests**. Production source is
  executed using Node VM contexts with minimal DOM doubles. Cases cover theme
  synchronization when storage throws, the view-transition path, preference
  prepaint fallback, feed cache access/write failure, malformed cached events,
  service fallback, boot without the intentionally absent hypershapes host,
  and an accessible original-engraving image when portrait enhancement fails.
  The VM normalizes `import.meta.url` to a stable module URL solely in the test
  harness, preserving the production relative-asset URL implementation.
- `git diff --check` passed for integration changes at review time.
- Validator failure behavior was exercised using temporary fixture documents:
  valid encoded/same-origin fragment paths passed; missing files/fragments,
  duplicate IDs, unresolved ARIA references, and absent image alt attributes
  failed. No dependency or permanent generated fixture was added.

## Material findings resolved during integration

1. A thrown theme preference write interrupted radio/meta synchronization.
   Preference storage is now optional, and the visible state still updates.
2. A successful activity response was discarded when cache persistence threw.
   The network response now renders independently of optional cache writes.
3. A fresh cache with a non-array `events` value could fail during rendering.
   Cache reuse now checks `Array.isArray`.
4. The new homepage intentionally omits the old hypershapes canvas. Boot now
   guards that optional host instead of passing a missing canvas to the engine.
5. Baseline all-public validation found a missing USAF image and an h1-to-h3
   heading jump. Integration removed the unavailable optional figure and gave
   the first content section an h2. No replacement evidence was invented.

## Source review

The homepage connects Work, About, the web résumé, Workshop, and contact using
ordinary links. Fall In is optional and never controls navigation. Its canvas
is decorative to assistive technology, with native buttons and descriptive
status text. The still scene does not run an idle animation loop. Running
motion stops while hidden/offscreen, preserves a manual pause, responds to a
reduced-motion preference change, and releases listeners/observers on disposal.
The résumé print control is hidden until its event handler is installed; the
no-JavaScript page explains the browser Print command.

About and résumé agree on location, military/teaching background, Champlain IT
master's degree, and Florida State Social Science Education degree. The ONTO
claim map in `docs/PORTFOLIO_EVIDENCE.md` distinguishes reviewed source,
user-reported history, and deployment verification. It records missing formal
employment chronology and does not invent dates, adoption metrics, testimonials,
or a downloadable preexisting PDF.

## Limits and remaining acceptance work

- Coordinator-reported browser smoke coverage: homepage, About, résumé, and ONTO
  at widths 320/390/768/1280 using a same-origin iframe viewport harness; document
  scroll width matched client width and navigation remained visible. Coordinator
  also exercised the case-study link, milk-to-white theme change, animation start
  and pause, and observed the still engraving fallback without WebGL2. These are
  coordinator results, not independent browser execution by this reviewer.
- This review used source inspection and automated local checks, not a browser.
  Full keyboard focus review, visual contrast, and print pagination still need
  rendered acceptance beyond the coordinator's smoke coverage.
- The validator listed **25 external URLs without fetching them**. It does not
  establish live ONTO availability, external profile status, remote font
  availability, or third-party stats availability.
- The Fall In journey is a new implementation of the established concept;
  this review does not establish pixel parity with unavailable original source.
  Without JavaScript/canvas, descriptive content remains but the interactive
  scene is unavailable.
- The web résumé provides print/save-as-PDF access. Exact employment and
  graduation dates remain a content follow-up requiring James's formal résumé.
- A passing VM test is not a browser-storage or view-transition compatibility
  test. A passing static validator is not a complete screen-reader audit.

No further material source-level integration issue was found in the reviewed
portfolio changes. Re-run checks on the final committed PR head when it differs
from this integration snapshot.
