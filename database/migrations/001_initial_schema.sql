-- ============================================================
-- CyberTrace - initial database schema (Supabase / PostgreSQL)
--
-- Tables follow the pseudocode in the Capstone 1 report (section 4):
--   users, scans, scan_results, recommendations, audit_logs
--
-- How to run: Supabase dashboard -> SQL Editor -> paste this file -> Run.
-- Safe to run once on a fresh project.
--
-- Security model (report NFR-01..NFR-06, risk R2):
--   * Passwords live only in Supabase Auth (auth.users), never here.
--   * Row-Level Security is on for every table. A logged-in user can only
--     read their own rows. Scans, results, recommendations and audit logs
--     are WRITTEN only by the backend using the service_role key, which
--     bypasses RLS. The app itself can never insert a fake scan or score.
--   * Admins (users.role = 'admin') can read everything for monitoring.
-- ============================================================


-- ------------------------------------------------------------
-- Helper: keep updated_at current
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================
-- USERS - profile data linked 1:1 to Supabase Auth accounts
-- ============================================================
create table public.users (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  email        text not null unique,
  first_name   text not null default '',
  last_name    text not null default '',
  role         text not null default 'user'  check (role in ('user', 'admin')),
  plan         text not null default 'free'  check (plan in ('free', 'premium')),  -- FR-22 scan limits
  preferences  jsonb not null default '{}'::jsonb,                                 -- FR-11 theme, notifications
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- True when the current logged-in user is an admin.
-- SECURITY DEFINER so it can read users without tripping RLS recursion.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.users
    where user_id = auth.uid() and role = 'admin'
  );
$$;


-- ============================================================
-- SCANS - one row per digital footprint scan (pseudocode 4.2.3)
-- ============================================================
create table public.scans (
  scan_id          uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users (user_id) on delete cascade,
  identifier       text not null,
  identifier_type  text not null check (identifier_type in ('EMAIL', 'USERNAME')),
  status           text not null default 'IN_PROGRESS'
                     check (status in ('IN_PROGRESS', 'COMPLETED', 'FAILED')),
  risk_score       integer check (risk_score between 0 and 100),
  risk_level       text check (risk_level in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  created_at       timestamptz not null default now(),
  completed_at     timestamptz
);

-- Scan History screen: "my scans, newest first" (NFR-09)
create index scans_user_created_idx on public.scans (user_id, created_at desc);


-- ============================================================
-- SCAN_RESULTS - each exposed item found during a scan (4.2.4 / 4.2.6)
-- ============================================================
create table public.scan_results (
  result_id    uuid primary key default gen_random_uuid(),
  scan_id      uuid not null references public.scans (scan_id) on delete cascade,
  source       text not null,     -- e.g. 'XposedOrNot', 'GitHub'
  category     text not null
                 check (category in ('DATA_BREACH', 'SOCIAL_MEDIA', 'PUBLIC_RECORD', 'OTHER')),
  description  text not null,
  severity     text not null check (severity in ('LOW', 'MEDIUM', 'HIGH')),
  created_at   timestamptz not null default now()
);

create index scan_results_scan_idx on public.scan_results (scan_id);


-- ============================================================
-- RECOMMENDATIONS - de-duplicated advice per scan (4.2.7)
-- ============================================================
create table public.recommendations (
  recommendation_id  uuid primary key default gen_random_uuid(),
  scan_id            uuid not null references public.scans (scan_id) on delete cascade,
  message            text not null,
  created_at         timestamptz not null default now(),
  unique (scan_id, message)
);

create index recommendations_scan_idx on public.recommendations (scan_id);


-- ============================================================
-- AUDIT_LOGS - security and activity events (NFR-06, FR-20)
-- Kept when a user is deleted (user_id becomes null) for accountability.
-- ============================================================
create table public.audit_logs (
  log_id      uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users (user_id) on delete set null,
  action      text not null,     -- e.g. 'SIGN_UP', 'LOGIN', 'SCAN_COMPLETED', 'SCAN_DELETED'
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index audit_logs_user_created_idx on public.audit_logs (user_id, created_at desc);


-- ============================================================
-- AUTH TRIGGERS - keep public.users in sync with Supabase Auth
-- ============================================================

-- On sign-up: create the profile row and log SIGN_UP (pseudocode 4.1.1).
-- The app passes first/last name as sign-up metadata:
--   supabase.auth.signUp({ email, password,
--     options: { data: { first_name, last_name } } })
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (user_id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', '')
  );

  insert into public.audit_logs (user_id, action)
  values (new.id, 'SIGN_UP');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- On email change in Supabase Auth: copy it into public.users (4.2.2).
create or replace function public.handle_auth_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.users set email = new.email where user_id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_auth_email_change();


-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================
alter table public.users           enable row level security;
alter table public.scans           enable row level security;
alter table public.scan_results    enable row level security;
alter table public.recommendations enable row level security;
alter table public.audit_logs      enable row level security;

-- Logged-out visitors get nothing.
revoke all on public.users, public.scans, public.scan_results,
              public.recommendations, public.audit_logs
  from anon;

-- Logged-in users: read-only by default, then open up exactly what's needed.
revoke all on public.users, public.scans, public.scan_results,
              public.recommendations, public.audit_logs
  from authenticated;

grant select on public.users, public.scans, public.scan_results,
                public.recommendations, public.audit_logs
  to authenticated;

-- Users may edit only these profile columns. role, plan and email are
-- protected (email changes go through Supabase Auth, see trigger above).
grant update (first_name, last_name, preferences) on public.users to authenticated;

-- Users may delete their own scans (FR-08). Results and recommendations
-- are removed automatically by ON DELETE CASCADE.
grant delete on public.scans to authenticated;


-- ---------- users ----------
create policy "users: read own profile"
  on public.users for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "users: update own profile"
  on public.users for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------- scans ----------
create policy "scans: read own scans"
  on public.scans for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "scans: delete own scans"
  on public.scans for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------- scan_results ----------
create policy "scan_results: read results of own scans"
  on public.scan_results for select to authenticated
  using (
    exists (
      select 1 from public.scans s
      where s.scan_id = scan_results.scan_id
        and s.user_id = (select auth.uid())
    )
    or (select public.is_admin())
  );

-- ---------- recommendations ----------
create policy "recommendations: read recommendations of own scans"
  on public.recommendations for select to authenticated
  using (
    exists (
      select 1 from public.scans s
      where s.scan_id = recommendations.scan_id
        and s.user_id = (select auth.uid())
    )
    or (select public.is_admin())
  );

-- ---------- audit_logs ----------
-- Users can see their own activity (mockup: "User activity & Account security").
create policy "audit_logs: read own activity"
  on public.audit_logs for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
