# Personal Website sprint handoff

Resumed and implemented 2026-11-04. Repository: `JamesTRichmond/JamesTRichmond`.
Integration branch: `sprint/portfolio-fall-in-20261022` (retained from the earlier
interrupted run). Starting current-main commit: `b408e5be12f4f60b727d97ce7c164d46a9313514`.

## Delivered

- Homepage: selected work, optional Jamestellation interaction, About summary,
  existing Habitat and engraving exhibits, contact, and expandable GitHub area.
- `/work/onto/`: source-grounded case study explaining role, user flow,
  architecture decisions, privacy boundaries, and tradeoffs.
- `/about/`: background, education, working approach, and links to existing rooms.
- `/resume/`: readable web résumé with print/save-as-PDF action and print styles.
- Fall In: deterministic canvas face, golden hair, mouth-centered flight,
  repeatable return, native controls, reduced-motion still alternatives,
  visibility suspension, and disposal. No idle animation frames for this module.
- Preference and activity-cache failures degrade without blocking the page.
- Navigation and content work without JavaScript. Enhancements reveal their
  controls only after initialization; Habitat has a source-link fallback.
- The Thor exhibit retains the original plate when WebGL2 is unavailable.
- Removed an unavailable optional USAF photo and repaired its skipped heading.

No dependencies/build step added. `CNAME`, Pages configuration, workflows,
README automation, robot modules, and the existing robot branch were preserved.
Nothing was merged into main or deployed.

## Ownership and coordination

Four agents used separate branches/worktrees. The coordinator integrated their
commits and owned existing shared files throughout.

| Owner | Owned files |
| --- | --- |
| Structure | `assets/css/portfolio.css`, `assets/js/portfolio.js`, `about/index.html` |
| Animation | `assets/js/fall-in.js`, `assets/css/fall-in.css`, `tests/fall-in.test.mjs`, `docs/fall-in.md` |
| Content | `work/onto/index.html`, `resume/index.html`, `docs/PORTFOLIO_EVIDENCE.md` |
| Review | `scripts/validate_portfolio.py`, `tests/portfolio-static.test.mjs`, `docs/PORTFOLIO_REVIEW.md` |
| Coordinator | `index.html`, `assets/js/site.js`, `assets/js/chrome.js`, `assets/css/home.css`, bounded USAF cleanup, decisions and this handoff |

Before implementation, current instructions and branches were inspected. No
`AGENTS.md`/`CODEOWNERS` or open PRs/issues were present in this repository.
`copilot/upgrade-robot-design` overlaps `index.html` and `site.js`; its robot code
was not incorporated. A future merge of that branch needs a fresh overlap review
around homepage wiring. Do not overwrite either branch wholesale.

## Validation

Reproduce from the checkout root:

```sh
node --test tests/*.test.mjs
python3 scripts/validate_portfolio.py --all-public
git diff --check
```

The final automated run passed 22 tests (14 animation and 8 resilience/fallback).
The tests exercise timing, projection, deterministic repeatability, lifecycle
cleanup, hidden/offscreen/manual pause, dynamic reduced motion, blocked preference
storage, cache failures, malformed cache data, and boot without background shapes.
They are Node tests with DOM doubles; they do not represent a device certification.

The public-page validator passed for 11 pages and 277 HTML references after the
coordinator's fallback changes. It covers local assets/links/fragments, metadata,
heading order, duplicate IDs, image alternatives, and referenced ARIA IDs.
The 25 external URLs are listed but are not availability-checked by that script.
The independent review records its earlier 275-reference snapshot separately.

Coordinator browser verification used the managed Chrome preview:

- Homepage, About, résumé, and ONTO each reflowed at iframe viewport widths of
  320, 390, 768, and 1280 pixels. Document scroll width equaled client width
  in all 16 combinations. This is viewport testing, not an iPhone/Safari test.
- Milk and white themes rendered; theme selection persisted across navigation.
- Homepage → ONTO case study and its engineering-decisions anchor worked.
- Keyboard Tab revealed the skip link, Enter focused `main`, and Space activated
  the Fall In native button. Start/pause controls changed their visible status.
- A sandboxed frame without script permission retained homepage navigation,
  case-study links, biography and contact; unavailable enhancements were hidden.
- The résumé print action was exercised. Native print pagination/export was not
  observable through this browser interface and is not claimed as verified.
- The browser lacks WebGL2. The new fallback displayed the original engraving;
  the animated shader itself could not be visually accepted in this environment.

Preview harness files and preview configuration are local QA material only and
are not part of the proposed website.

## Remaining work, in order

1. Review the proposed PR and the visual direction with James. Publication needs
   separate authorization; do not merge or deploy as part of a continuation.
2. Confirm current formal résumé chronology, graduation dates, and exact
   certification names before adding them. The current web résumé uses known
   background without inventing an exhaustive employment timeline.
3. Test the résumé's native print/PDF pagination in a desktop browser, and check
   the full site on actual iPhone Safari. Test dynamic reduced-motion settings
   there; the automated lifecycle tests already cover the implementation.
4. Confirm the public ONTO deployment against the case study. The domain is
   established by current source, but live retrieval failed during evidence
   collection. Implementation and a deployed feature are separate evidence.
5. If desired, add an approved real ONTO screenshot/demo asset to the case study.
   No simulated image is presented as a real application screenshot here.

The original full Fall In source was not recoverable in this checkout. The new
module rebuilds the established concept; do not claim pixel parity. See
`PORTFOLIO_EVIDENCE.md` for factual sources and `fall-in.md` for module contracts.
