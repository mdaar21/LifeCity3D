# Changelog

## 0.1.0 — 2026-10-30

- Created separate LifeCity application without modifying Mdaar.
- Added bilingual Arabic-first React UI and original procedural3D city/interiors.
- Added authenticated transactional wallet/tasks/study/prayer/commerce/Yuyi SQL,
  RLS, server clock reconciliation, immutable ledger and optimistic versioning.
- Added Supabase integration, persistent local reference server, and clearly
  separate browser-only guest demo.
- Added custom daily/weekly/once schedules, profile avatars, PWA and legal drafts.
- Added real SQL/auth/persistence/role tests and two-browser UI checks; final
  command results and limitations recorded in docs/release.md.
- Added CI and Netlify configuration; hosted Supabase/real email/push/payments
  remain unconfigured. New GitHub repository creation was denied by integration.
- Applied the owner's later GitHub-only publication policy. Added base-aware
  assets, authentication callbacks and invites, Pages SPA fallback, production
  CSP, Pages deployment workflow and actual compiled-browser/offline checks.
  Preserved historical compatibility files; the old Netlify deploy helper is disabled.
- Corrected vendor chunk ownership so shared React/runtime code does not force
  the 3D engine into a cold login page. Verified the actual browser requests.
