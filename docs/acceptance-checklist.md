# Historical0.2 acceptance — 2026-10-30

For the owner-approved Ultimate V6 scope and honest incomplete status, use
[v6/STATUS.md](v6/STATUS.md). The table below describes the earlier0.2 scope.

Continue from this project and its existing data. This checklist distinguishes
implemented code and actually executed local checks from unfinished external
configuration. It is not a production launch or a claim of fifty expert votes.

| Requirement | Implemented and checked locally | Remaining boundary |
|---|---|---|
| Original bilingual product | Arabic default, English, RTL/LTR, theme, digits, timezone, original forest/ivory visual system and licensed local fonts | Commercial name/legal review |
| Accounts and exact saves | Supabase Auth/RPC adapter; working persistent reference accounts; isolated identity-keyed cache; logout guards; exact two-browser wallet/inventory/placement recovery | Hosted schema/RPC presence now inspected; Auth/build configuration, email delivery and hosted real-device test remain |
| Trust and currency | Server row locks, immutable ledger and compensation, negative funds, separate XP, price authority, rate/ownership checks, idempotent retries | Hosted load/monitoring |
| Activities | Study1/minute and one20 bonus at60; persisted pause/resume,90s idle cap; room40/bed10/workout50; daily/weekly/once custom schedules | Optional push provider remains disabled |
| Prayers | Five independent statuses; Fajr30, others20; explicit missed−100, pending/excused0, audited correction and timezone day | Logs are self-report, not objective verification |
| Yuyi | Separate account, one-use expiring invite, scopes/caps/revocation, chosen signed amount, confirmations, messages/challenges and persistent garden memories | Requires configured accounts; guest preview cannot link partners |
| Real3D | R3F island, original25-item procedural catalog, camera/picking/grid ghost, collision, rotate/move/remove, inventory, expansion, water and persisted8×8 interiors | Automatic NPCs/moving cars cancelled; weather/seasons/multiple rooms deferred; no mobile FPS guarantee |
| First-city guide and saving projects | Saved task/tree/manual-placement milestones; server-priced partial funding, audited refund and one inventory completion | No automatic placement; cloud configuration still required for cross-device hosting |
| Focus and city visits | Credited-time plant; optional7-day exterior-only link, anonymous viewing, account reactions and revocation; no private data projection | Guest mode cannot create public links; hosted provider unconfigured |
| Linked starter | Optional pinned Git reference, current build preserved, original configuration validation and tests | Third-party source is not redistributed in the app |
| Progress and screens | Immersive city HUD, game dock/windows, compact missions, separated shop/projects, Player/city XP, stats/ledger, privacy/data controls and title pages | No functioning real-money payment claim |
| Offline PWA | Actual install icons, scoped SW, saved read-only state, disabled financial actions, no automatic offline awards | Cross-device continuity needs successful cloud saves |
| Safety and tenancy | SQL RLS, protected RPC helpers, cookie auth/CSRF in local reference, account isolation, export/delete, forward migrations preserving data | Provider backups/restore drill, production operational review |
| QA |43 tests across12 files,8 browser journeys in focused runs, strict TS/lint/build,9 current interface accessibility/layout states; compiled Pages route/PWA checks | Automated checks do not replace real phone or hosted acceptance |
| Delivery | Independent local Git history, setup docs, migration/seed, CI and GitHub Pages workflow, reproducible source/Pages artifacts | Existing main frontend published; this interface continuation is a review branch until merged |

See [release.md](release.md) for actual evidence and limitations and
[deployment.md](deployment.md) for GitHub-only deployment. The historical
Netlify-compatible files are preserved, but the old upload helper is disabled.

The actual delegated module work was split among six agents (core SQL;
city/partner SQL; application UI;3D/shop; social UI; backend/QA), with the root
responsible for integration, package installation, process execution, tests and
Git. Roles and contracts are recorded in [architecture.md](architecture.md).
No remote service or fifty-agent consensus is inferred from that work.
