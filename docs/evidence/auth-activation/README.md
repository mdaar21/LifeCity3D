# Supabase account activation

Narrow increment from published main5d567ae. No visual batch, horticulture,
database migration, Edge redeployment, wallet reset or seeded asset is included.

- Enables the existing public Supabase client. Email confirmation remains required.
- Handles account callbacks even if a guest session was open. Only the adapter
  preference is cleared after an account session is returned; guest saves remain.
- Direct hosted invalid-token probes showed the Site URL is already
  https://mdaar21.github.io/LifeCity3D/. The dashboard and reset-password callback
  destinations are accepted; an external destination falls back to the Site URL.
  These probes created no users and sent no messages.
- Real hosted password login, callback after guest use, a40 reward, a20 paid tree,
  placement/rotation and exact independent-mobile-browser/reload restoration
  passed with a disposable pre-confirmed diagnostic account. MAIN20, MAD0.
- The saved guest record remained identical. No public email delivery is claimed.
  Synthetic reserved-domain signup probes were rejected as email_address_invalid,
  so they establish neither SMTP readiness nor SMTP failure. Management/Auth
  configuration is not exposed by the connected MCP tools and no management token
  is available here. No confirmation policy was weakened to hide that limitation.
- Lint/typecheck and the compiled Supabase-mode Pages build passed. The final
  full suite passed96 tests in20 files; focused callback/Auth/authority checks passed19.
  The publication workflow runs the full final suite and browser regressions again.

scripts/check-hosted-auth.mjs reproduces the hosted browser check using a
work/auth-fixture.json diagnostic account with a mandatory reserved address
pattern. The fixture file, password and tokens are never committed. The account
is temporary and must be removed with sessions revoked after live verification.

See hosted-browser.json for actual local-compiled/real-hosted scope. A separate
live-site report is recorded after publication; this file is not evidence that
email confirmation or recovery messages reached a human inbox.

## Published acceptance

PR5 merged at22c1098. Pages run41230810738 succeeded with96 unit/integration
tests and14 browser cases. The REAL public website passed password login in
desktop/mobile contexts, exact cloud-save restoration, reload and logout. See
live-site.json. The diagnostic account/profile/sessions were removed and the
remaining counts were verified as0. Email delivery remains unverified.

This final evidence is recorded on codex/stylized-visual-overhaul so recording
acceptance does not trigger another production build. Only Auth was published.
