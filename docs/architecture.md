# Architecture and implementation contract

React/strict TypeScript/Vite + R3F/Three/Drei, Zustand interactions, TanStack Query,
i18next, Supabase Auth/Postgres/RPC/Realtime. PostgreSQL is authoritative. All
privileged mutations use a single authenticated idempotent command boundary.
No payments, Google OAuth or push notifications are advertised as working unless
configured. Production credentials are currently absent; do not fabricate them.

## Backends
1. supabase: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY, real Auth and SQL RPC.
2. local: development/reference Node server + on-disk PGlite/Postgres, HttpOnly
   local auth cookies; all same SQL commands and RLS. Not hosted cloud save.
3. demo: explicitly local guest preview; browser state separate from authenticated
   cloud accounts. No cloud, security or multi-device claims. Must stay playable.

Snapshot and payload fields are snake_case and defined in src/lib/types.ts.
RPC game_state() returns GameSnapshot. RPC game_command(p_action text,p_payload
jsonb,p_key uuid) returns {state:GameSnapshot|null,result:Record<string,unknown>}.
API calls retry with SAME key, including deliberate retry after a lost response.
Offline writes are blocked, not queued. Poll30s + realtime invalidation reconcile.
Errors are stable machine codes from SQL, localized by client (never raw SQL).

## Module ownership
- core_db: supabase/migrations/001_core.sql, seed.sql, core SQL tests/spec.
- city_partner_db: supabase/migrations/002_city_partner.sql, city/partner SQL tests.
- app_ui: src/pages/{Dashboard,Tasks,Timer,Prayers,Auth,Landing}.tsx;
  src/components/{AppLayout,Common}.tsx and src/app.css.
- world_shop: src/world/**; src/pages/{City,Shop,Interior}.tsx; src/world.css.
- social_ui: src/pages/{Yuyi,Stats,Settings}.tsx and src/social.css.
- backend_qa: server/**; tests/integration/**; tests/e2e/**; playwright.config.ts.
- root: src/lib/**, shared type/catalog, locales, app wiring, config, PWA,
  docs, root package/tsconfig/lint/CI, execution and release.

## SQL helper contract
001 defines all tables, grants, RLS and helpers. auth.uid() is supplied by
Supabase, shimmed ONLY in local server/test harness. Use auth.users(id uuid,email
text,raw_user_meta_data jsonb) shim there. A signup trigger creates own records.
001 game_command wraps: validate authenticated caller, acquire wallet row lock,
command key receipt unique(user_id,key), dispatch core or module, return state.
Unknown action delegates to public.city_partner_command(v_uid,p_action,p_payload,
p_key) -> jsonb result. Function may be added by002. All security-definer functions
SET search_path=public,pg_temp; helper execute grants REVOKED from public/anon/
authenticated; only game_state/game_command exposed to authenticated.

Common helper public.apply_coins(p_user uuid,p_delta integer,p_reason text,
p_key text,p_actor uuid DEFAULT NULL,p_xp integer DEFAULT0) -> void. Append-only
ledger unique(user_id,idempotency_key), updates wallet atomically. No negative XP.
public.ensure_player(p_user uuid) -> void sets initial profile/wallet/world/default
tasks. public.game_state_for(p_user uuid) -> jsonb restricted helper, no arbitrary
read grants. Snapshot uses public catalog and own records. Partner view is separate
explicit consent-filtered result from partner inspect command, not all own data.

Core tables: profiles, wallets, coin_transactions, task_definitions,
task_completions, study_sessions, prayer_logs, prayer_audit, user_preferences,
city_worlds, city_land_tiles, catalog_items, inventory_items, city_placements,
furniture_placements, achievements, command_receipts, partner_links,
partner_permissions, partner_actions, partner_messages, partner_challenges,
yuyi_memories, sync_events. All exposed tables RLS enabled.

## Commands (all payloads validated server-side)
task_complete {task_id}; task_create {title,reward,category,daily_limit};
task_archive {task_id}; study_start {}; study_pause/resume/finish/heartbeat
{session_id}; prayer_set {prayer,day?,status,confirmed_missed?};
profile_update {display_name?,language?,timezone?,theme?,digits?,currency_label?,
custom_reward_limit?,task_daily_limit?};
purchase {catalog_id}; place {inventory_id,x,z,rotation};
move {placement_id,x,z,rotation,expected_version}; remove {placement_id,
expected_version}; land_expand {}; interior_place {house_id,inventory_id,x,z,
rotation}; interior_move/remove {placement_id,...,expected_version};
partner_invite {}; partner_accept {code}; partner_policy {link_id,can_award,
can_deduct,can_view_city,can_view_tasks,max_award,max_deduction,daily_award_limit,
daily_deduction_limit}; partner_adjust {owner_id,amount,reason?,note?,confirmed?};
partner_unlink {link_id}; partner_message {owner_id,message};
partner_challenge {owner_id,title,reward}; partner_inspect {owner_id};
delete_account {confirmation:'DELETE'}.

All furniture inventory rows are separate owned items (not quantities). Place
in city only non-furniture; interiors use furniture inside owned house/villa/
palace. Removing recovers inventory without refunds. Grid x/z are integer0..size-1,
rotation one of0/90/180/270. Object footprint rotates and collision is enforced
server-side. Starting world16x16; expansion increments4 (max32), price1000.
Catalog JSON in src/lib/catalog.ts is client display only. SQL catalog centrally
seeded in seed.sql, source of server prices. Price mirrors must be tested.

## Milestones / release limits
M1 contracts + scaffold; M2 SQL + playable city/UI; M3 local/reference and demo
end-to-end + security tests; M4 cloud adapter + release docs + CI/build + preview.
Supabase production multi-device/OAuth/email delivery/backups stay unverified until
real project configuration and live tests exist. No production-ready claim.
