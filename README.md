<a href="https://jamestrichmond.com/"><img src="https://raw.githubusercontent.com/JamesTRichmond/JamesTRichmond/main/assets/thor/thor.webp" width="320" align="right" alt="A 19th century engraving of Thor, in colour and moving: smoke billowing off the crag behind him, his beard and drape in the wind, and lightning growing out of his hammer into an arch over his crown" /></a>

# James Richmond

agentic systems & closed-loop orchestration :: privacy & client-side security :: fmr af 2w2 (top secret) :: ms it, cybersec, data sci, & df/ir :: fmr ap teacher :: territory sales for r&d

*My profile picture, animated and coloured. GitHub flattens avatars to a single frame, so it lives here instead. Nothing was redrawn and nothing was painted in: every pixel is the engraver's own line, displaced by a shader and lit by a colour grade. [The live version is on my site.](https://jamestrichmond.com/)*

<br clear="right" />

**Every badge below goes somewhere.**

<a href="https://jamestrichmond.com/python/"><img src="https://img.shields.io/badge/Python-2b1d12?style=for-the-badge&logo=python&logoColor=8ab4f8" alt="Python" /></a>
<a href="https://jamestrichmond.com/typescript/"><img src="https://img.shields.io/badge/TypeScript-2b1d12?style=for-the-badge&logo=typescript&logoColor=7aa2ff" alt="TypeScript" /></a>
<a href="https://github.com/AgentiCubed/agenticubed"><img src="https://img.shields.io/badge/AI%20Agents-2b1d12?style=for-the-badge&logo=anthropic&logoColor=6ee7a0" alt="AI Agents" /></a>
<a href="https://jamestrichmond.com/security/"><img src="https://img.shields.io/badge/Cybersecurity-2b1d12?style=for-the-badge&logo=owasp&logoColor=f2a63b" alt="Cybersecurity" /></a>
<a href="https://jamestrichmond.com/teacher/"><img src="https://img.shields.io/badge/AP%20US%20History-2b1d12?style=for-the-badge&logo=academia&logoColor=9ad3a0" alt="AP US History" /></a>
<a href="https://jamestrichmond.com/usaf/"><img src="https://img.shields.io/badge/USAF%20Veteran-2b1d12?style=for-the-badge&logo=rocket&logoColor=8fbcff" alt="USAF Veteran" /></a>

---

## systems: closed loops, security & adversarial reasoning

I build agentic architectures, client-side security tools, and observable evaluation engines that turn unpredictable model behavior into deterministic software.

### [AgentiCubed](https://github.com/AgentiCubed/agenticubed)
*Closed-loop orchestration platform connecting intake, DAG task execution, evaluation, and remediation.*
- Converts high-level objectives into human-approved task graphs, resolves predecessor dependencies, and dispatches to Celery/Redis workers.
- Strict separation between executor and evaluator agents; outputs must satisfy structured Pydantic contracts or the system fails closed, captures error diffs, and dynamically reprompts for automated remediation.
- 268 passing tests (Pytest/Vitest), default-deny tool permissions, and immutable execution logs. Built with Python, FastAPI, Next.js, and PostgreSQL.

### [BannerBanner](https://github.com/AgentiCubed/bannerbanner)
*Privacy-first Chrome Manifest V3 extension built on strict consent boundaries and security restraint.*
- Hides consent dialogs only on user-authorized origins via explicit CMP adapters (OneTrust, Cookiebot, CookieYes, Usercentrics)—strictly rejecting reckless "click-anything" fallbacks.
- Zero server accounts, zero remote telemetry, and isolated local storage; leaves login, checkout, and sensitive dialogs untouched.
- 71 unit tests, 33 browser tests, and cross-platform byte-deterministic packaging.

### [Verbal Kombat](https://github.com/JamesTRichmond/Verbal_Kombat)
*A 2D fighting game that acts as a real-time visualization and reinforcement learning harness for multi-agent debate.*
- Two AI minds battle over complex premises: valid logic and sound arguments land as strikes and combos, while logical fallacies miss, get blocked, or backfire into damage.
- Health bars represent the structural integrity of an argument; every round produces an annotated transcript scrubber mapping hitboxes directly to lines of reasoning.
- Modular TypeScript monorepo architecture: `@vk/core`, `@vk/debate`, `@vk/judge` (fallacy taxonomy & soundness verdicts), and `@vk/combat` (verdicts → physics).

### [SCE Probe Runtime](https://github.com/JamesTRichmond/sce-probe-runtime)
*Pre/post runtime telemetry and behavioral scoring around irreversible tools.*
- Silent held-out micro-probes that score model certainty against actual behavior (`claim↔act` matching) before state-mutating tool calls execute.
- Seals execution triplets into append-only hash chains for SOC-style audit and replay.

---

<!--START_SECTION:robot-->
<a href="https://jamestrichmond.com/#habitat"><img src="https://raw.githubusercontent.com/JamesTRichmond/JamesTRichmond/main/assets/robot/sleep.gif" width="760" alt="A small robot asleep on a mat. Click him and he becomes controllable." /></a>
<!--END_SECTION:robot-->

He does something different every day. **[Click him](https://jamestrichmond.com/#habitat)** and he becomes yours to drive — arrow keys to walk, space to jump, and you can pick him up and throw him.

## habitat

A robot who lives on a web page — jointed SVG rig, spring physics, and a small state
machine that decides what he does with his day. No dependencies, no build step.

[Play with him](https://jamestrichmond.github.io/habitat/) · [Source](https://github.com/JamesTRichmond/habitat) · [In the wild](https://jamestrichmond.com/#habitat)

## GitHub Stats

<p align="center">
  <img src="https://jamestrichmond-readme-stats.vercel.app/api?username=JamesTRichmond&show_icons=true&theme=github_dark&hide_border=true&count_private=true" alt="James's GitHub stats" width="48%" />
  <img src="https://jamestrichmond-readme-stats.vercel.app/api/top-langs/?username=JamesTRichmond&layout=compact&theme=github_dark&hide_border=true&hide=html,css" alt="Top languages" width="40%" />
</p>

## Guestbook

Sign it: [open an issue](https://github.com/JamesTRichmond/JamesTRichmond/issues/new?template=guestbook.yml). A bot sanitizes your note, writes you onto the wall, thanks you, and closes the issue. No humans involved.

If you'd rather attack it than sign it, [the sanitizer runs in your browser here](https://jamestrichmond.com/security/).

<!--START_SECTION:guestbook-->
- **[@JamesTRichmond](https://github.com/JamesTRichmond)** — Real end to end test after the Issues permission fix. · 2026-09-08
<!--END_SECTION:guestbook-->

<!-- Don't Try. — Bukowski -->

## 3D Contribution Graph

<p align="center">
  <img src="https://raw.githubusercontent.com/JamesTRichmond/JamesTRichmond/main/profile-3d-contrib/profile-night-view.svg" alt="3D contribution graph" />
</p>
