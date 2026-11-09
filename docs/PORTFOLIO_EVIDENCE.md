# Portfolio content evidence

Reviewed 2026-11-04 for the Personal Website portfolio sprint. This is an editorial
claim map, not a production acceptance report. No ONTO code, account, backend,
configuration, or deployment was changed for this work.

## Evidence boundaries

- ONTO's private repository was read only to verify public-safe product and
  engineering descriptions. No raw founder answers, credentials, personal
  records, unpublished operational configuration, or internal source links are
  reproduced on the portfolio pages.
- The architecture baseline remains a founder-informed target-design draft.
  Its proposed release scope is not used as proof of implemented behavior.
- Source implementation, a passing check, and a deployed experience are separate
  claims. This content does not assert adoption, revenue, user counts,
  performance scores, a current test count, or live device acceptance.
- The portfolio's existing README and interactive rooms supplied the writing
  reference. Existing test-count claims in that README were not repeated.

## Claim map

The SHA column records the Git blob returned by the connected source, not a
claim that a running deployment uses that revision. ONTO filenames identify the
reviewed evidence without creating public links into its private repository.

| Public claim | Evidence | Blob SHA / provenance | Limits |
| --- | --- | --- | --- |
| ONTO is an actively developed location-based PWA for events and places; guest browsing and plans coexist with optional account sync | ONTO `README.md` | `bd6c11b4c797dfed8197189616c4462efe919d54` | Availability depends on deployed build and backend configuration |
| TypeScript, Expo, React Native Web, Supabase and PostgreSQL form the app stack | ONTO `README.md`, `ARCHITECTURE.md` | README above; architecture `5dece308c229e3ad6a8194bb69fdc295361c7b15` | No backend or production build was exercised |
| Feed decisions take explicit time and location inputs and expose search, sort and filtering | ONTO `lib/feed.ts` | `cbc08aa5a047ae601dcff764236c6f1a8fc551ab` | Read source; did not run ONTO tests |
| One resolved location context includes source, service region and timezone; unresolved locations are explicit states | ONTO `lib/location-choice.ts` | `304068f7176db70ebdf107681ce3e628735bfba2` | Did not test browser geolocation or current UI |
| Source registration validates names and nonoverlapping ID prefixes | ONTO `scripts/pipeline/source-contract.js` | `a0bed8b63c4d39f1c2cadf421418e636e67feb78` | Cooperative application boundary, not a sandbox for untrusted code |
| Shared ingestion supports validation, attribution, deduplication and incomplete-refresh protections | ONTO `README.md`, `ARCHITECTURE.md` | SHAs above | No ingestion run or coverage audit performed |
| Cached public events and bundled regional snapshots support fallback; fresh data and sync need connectivity | ONTO `README.md`, `ARCHITECTURE.md` | SHAs above | No offline browser acceptance was performed here |
| Browsing does not require login; precise coordinates are memory-only; local preferences/cache and optional account records exist | ONTO `README.md`, `lib/location-choice.ts`, `PRIVACY.md` | Privacy `f98b163d29d9eb1b8d21d1c900a072df779ddac0` | Privacy document identifies itself as a candidate; portfolio avoids a comprehensive production compliance claim |
| ONTO public project destination is `https://onto.events/` | ONTO `README.md` | README SHA above | Public web retrieval failed for both domain and listed Cloudflare host. Destination is source-established, availability unverified |
| James built ONTO end to end with an AI-assisted workflow | User's project/interview account supplied in session context | User-reported | No invented collaborator credits or claim of manual-only authorship |
| James is a full-stack developer based in Middlebury, Vermont | Current request/profile and existing site | User-supplied; existing `index.html` | No claim of a current employer or job offer |
| Prior Air Force nuclear weapons technician and teaching in Florida/Vermont | Existing site, `README.md`, `usaf/`, `teacher/`; user background | User-reported and existing public narrative | Exact service dates, rank, and current clearance status intentionally omitted |
| Lincoln teaching AP History/Psychology/social sciences, then Vergennes | User background supplied in session | User-reported | Exact employment dates omitted pending formal résumé |
| Champlain master's in IT; FSU Social Science Education degree | User background supplied in session | User-reported | No guessed graduation dates, GPA, precise degree abbreviations, or unverified certification names |
| Email, GitHub, LinkedIn contact destinations | Existing website `index.html` | Existing public contact links | No messages sent; profile ownership/status not independently reverified |
| Habitat uses SVG rig, physics and state machine; sanitizer exercise is interactive | Existing site source and README | Existing public project artifacts | Root sprint handles browser validation; résumé asserts no numerical benchmark |

## Instructions consulted

Personal Website `DECISIONS.md`, `README.md`, `WORKSHOP_BRIEF.md`.
ONTO `AGENTS.md`, `docs/architecture/README.md`, `baseline-draft.md`, architecture
`decisions/README.md` and `research/README.md`, root `ARCHITECTURE.md` and source
files above. The ONTO policy remained scoped to read-only evidence review; its
implementation task limits and runtime wrappers were not imported into the
Personal Website project.

## Remaining evidence and review

1. Obtain James's current formal résumé if an exact employment chronology,
   graduation dates, or named certification list is wanted. The current web
   résumé uses only established background and selected work; it is not presented
   as an exhaustive chronology.
2. Root should verify the portfolio's About and résumé facts against each other,
   including phrasing of degrees and teaching subjects.
3. Root should test links, keyboard navigation, print behavior, and layouts after
   integration. A print button saves via the browser; no preexisting PDF is
   advertised.
4. ONTO live availability and deployed feature verification remain separate. The
   portfolio links the source-established project domain, with no uptime claim.
5. Refresh the source claim map when ONTO changes. In particular, do not treat a
   future architecture proposal as a shipped feature or add a blanket “no data
   collection” assertion.
