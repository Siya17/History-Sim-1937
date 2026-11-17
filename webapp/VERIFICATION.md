# Verification — 17 November 2026

Verified locally on Windows with Node.js 24, PostgreSQL 18.6, Next.js 16.4.6 and Prisma 7.10.1. CI is configured separately for Node.js 22 and PostgreSQL 17; the hosted CI workflow has not been run from this workspace.

| Check | Result |
| --- | --- |
| Lint | Passed |
| TypeScript | Passed |
| Rules, scoring and presentation | 33 tests passed |
| Production build | Passed |
| Browser classroom rehearsal | Passed in Chrome |
| Concurrent distinct orders and duplicate request replay | Passed |
| Concurrent round close | Passed |
| Authorization, revocation and other-room access | Passed |
| Responsive layout | Desktop and 390px phone captures inspected; no horizontal page overflow |
| 60 polling clients across two rooms | Passed; latest p95 1,735ms across 180 state requests |
| Backup and restoration | Passed: 19 records across 13 tables, including an exactly restored completed game snapshot, scoring summary, events and treaty relationships |
| Production dependency audit | Zero vulnerabilities |

The load fixture uses two participating countries per room and HTTP polling clients, not 60 rendered browser pages. It validates the stated synchronization threshold under that local workload; it is not a hosted production benchmark.

The development dependency audit still reports seven moderate findings through ESLint's transitive minimatch dependency. Compatible automatic fixes did not resolve them. They are excluded from the production audit.

No production database was modified and no cloud resource was provisioned. Vercel/Neon connection, production environment configuration, hosted migration and a real classroom pilot remain deployment steps. The legacy Python game and local SQLite database are preserved.

## Learning-interface update

- All 26 original Rules v2 checks and 7 new presentation/practice checks pass (33 total).
- The browser suite now also checks the opening mission, country briefing acknowledgment, practice with zero real command requests, incoming offers on two teammate devices, browser-local notification read state, and preservation of an unfinished decision after reviewing an offer.
- Desktop and phone captures were inspected. Decision category navigation limits the number of cards shown at once. Full resource names replace abbreviations in player-facing labels and explanations.
- Original period-style illustrations were generated with the built-in imagegen tool, optimized into eight local WebP assets, and inspected together. Prompts are recorded in `docs/art-prompts.md`.
- The English/Japanese narration and NotebookLM source documents match the practice example’s actual costs and round score.
- A live student pilot has not been performed; browser walkthroughs verify the intended tasks, not measured learning outcomes.

Latest redesign verification: all four browser scenarios passed, including a proposal arriving while the student is scrolled down; the sticky alert remained on screen. The production build passed after these changes. No database migration was introduced.
