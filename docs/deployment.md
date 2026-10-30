# GitHub-only deployment and real cloud account configuration

The owner requires publication through GitHub. Continue from this independent
repository; do not replace Mdaar, publish into it without approval, change a
private repository's visibility or buy a hosting plan automatically.

## GitHub Pages frontend

The connected GitHub identity is `mdaar21`. Both GraphQL createRepository and
REST repository creation were denied by the integration. The latest attempted
`gh repo create mdaar21/LifeCity3D --private` returned the same permission error.
This is a repository-creation authorization failure, not a missing build command.
Do not invent repository access or a live URL. See `evidence/github-create.txt`.

After the selected empty repository exists and the connection has access:

```sh
git remote add origin https://github.com/mdaar21/LifeCity3D.git
git push -u origin main
```

If an origin already exists, inspect it instead of overwriting it. Enable Pages
with source **GitHub Actions**. `.github/workflows/pages.yml` runs lint, strict
typecheck,41 unit/integration/configuration tests,6 browser tests, the production Pages build,
and the compiled guest route/PWA checks before publishing the artifact.
Private repository Pages eligibility depends on the actual GitHub plan. Keep its
visibility; do not purchase a plan or make it public as an automatic workaround.

To prepare and verify locally:

```sh
npm run build:github
npm run verify:github
```

`build:github` derives `/LifeCity3D/` from the repository name in Actions, or uses
an explicit `VITE_BASE_PATH`. It prefixes app assets, fonts, icons, manifest scope,
auth callbacks and partner invites. It creates `.nojekyll` and an app404 fallback.
A cold browser-router deep link returns HTTP404 plus the application shell on
Pages, after which React renders the route. This documented Pages behavior is
different from an HTTP200 server rewrite. The isolated local simulation checks it.

Optional `VITE_ROUTER_MODE=hash` is restricted to a clearly labeled guest-only
preview; configured authentication uses browser routing. A preview inside Mdaar
was suggested but has not been approved, copied or published. All full source
remains in this repository. No source files, database or secrets belong in a
compiled Pages upload. Pages serves static frontend assets, not the Node API.

## Supabase (not yet provisioned)

1. Create a dedicated Supabase project in the desired region. Do not apply these
   migrations to another application's database. Keep database/admin secrets out
   of the browser and repository.
2. Apply in order: `supabase/migrations/001_core.sql`, `002_city_partner.sql`,
   `003_realtime.sql`, `004_schedule_avatar_upgrade.sql`, `005_signup_locale.sql`,
   `006_projects_visits.sql`, then `supabase/seed.sql`. SQL editor runs with privileged
   project administration, not the anonymous browser key. With the Supabase CLI,
   link the project then `supabase db push --include-seed` after reviewing the diff.
3. Under Authentication enable email/password, choose email confirmation policy,
   configure production SMTP and the bilingual templates in `supabase/templates/`,
   set Site URL to the actual deployed app URL including its repository path,
   and add exact app callbacks, for example
   `https://mdaar21.github.io/LifeCity3D/dashboard` and
   `https://mdaar21.github.io/LifeCity3D/reset-password` only once that app exists.
   Google remains disabled unless real OAuth provider configuration is completed.
4. Set frontend build variables `VITE_BACKEND_MODE=supabase`,
   `VITE_SUPABASE_URL` (actual project URL), `VITE_SUPABASE_ANON_KEY` (public anon
   or publishable key). **Never use service_role or secret keys here.**
5. Add those three public frontend values as GitHub repository Actions variables
   and rebuild. The workflow's guest-mode browser checks intentionally skip a
   configured Supabase build; real hosted acceptance is a separate required gate.
   Test registration/confirmation/reset, two real devices sharing one
   account, an independent account, prayer corrections, purchase/placement and
   concurrent/retried commands against that hosted project before claiming cloud
   completion. SQL/locally executed browser tests do not substitute for this.

003 adds own wallet/world/profile tables to Realtime if the provider publication
exists. RLS protects visibility. Authenticated10s polling is a fallback; do not
claim a Realtime subscription is healthy merely because configured.

No real-money provider, OAuth secret, push sender or custom domain has been
invented. Use a configured provider and verify webhook signatures/transactions
before enabling billing; there is no real checkout in this release.

## Historical compatibility

`netlify.toml`, static header files and the disabled `scripts/deploy-preview.py`
are preserved from the original requested toolchain. They are not the active
publication workflow. An earlier separate site upload was denied with403 because
the account credit allowance was exhausted; no app was deployed and no allowance
or billing was changed. See `evidence/deployment-netlify-history.json`. Do not
retry that host under the owner's current GitHub-only instruction.

## Backups and retention

No managed backup service is configured. For local development, stop the local
server cleanly before copying the complete `.data/lifecity` directory to protected
storage; restore to a separate path and actually open/test it. Never commit that
directory. JSON export is an account export, not a full operational/auth backup.
For hosted production, document selected Supabase backup/PITR plan, retention,
region, encryption/access, restore drill frequency and deletion of expired
backups. Provider availability depends on its actual plan; do not assume PITR.
