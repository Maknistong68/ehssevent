-- ============================================================================
-- seed.sql — starter data for the internal pilot
--
-- Run AFTER 0001_schema.sql and 0002_rls.sql.
--
-- Creates:
--   • Two CLIENT organizations (Company A, Company B) — these are the two
--     "companies" used to prove RLS data isolation in the manual test.
--   • One contractor organization.
--   • One sample project per company.
--   • Helper functions to (a) promote your auth user to system_admin and
--     (b) attach pilot users to a company with a role.
--
-- HOW TO CREATE YOUR FIRST ADMIN LOGIN
--   1. Supabase dashboard → Authentication → Users → "Add user" → enter your
--      email + password (tick "Auto Confirm User").
--   2. Run:  select public.promote_to_system_admin('you@example.com');
--   3. Log in with that email/password — you arrive on the dashboard.
--
-- HOW TO CREATE A SECOND-COMPANY USER (for the privacy test)
--   1. Add another user in Authentication (e.g. user-b@example.com).
--   2. Run:  select public.assign_to_org('user-b@example.com',
--               'b0000000-0000-0000-0000-0000000000b1', 'client_admin');
--   (And similarly assign your first non-admin tester to Company A.)
-- ============================================================================

-- ── Safety gate: never seed a production database (A9 / C6) ──────────────────
-- This file loads demo organizations/projects and is for local / dev / pilot
-- use ONLY. To run it you must explicitly opt in for the current session:
--     set app.allow_seed = 'on';
-- Running it without that flag aborts, so the demo data can't reach production
-- by accident (e.g. a stray `supabase db reset` pointed at the wrong project).
do $$
begin
  if coalesce(current_setting('app.allow_seed', true), 'off') <> 'on' then
    raise exception
      'seed.sql is dev-only. Run "set app.allow_seed = ''on'';" first to confirm this is NOT a production database.';
  end if;
end;
$$;

-- ── Organizations ───────────────────────────────────────────────────────────

insert into public.organizations (id, name, org_type, contact_email, is_active)
values
  ('a0000000-0000-0000-0000-0000000000a1', 'Company A',          'client',     'admin@company-a.example', true),
  ('b0000000-0000-0000-0000-0000000000b1', 'Company B',          'client',     'admin@company-b.example', true),
  ('c0000000-0000-0000-0000-0000000000c1', 'Pilot Contractors',  'contractor', 'ops@contractor.example',  true)
on conflict (id) do nothing;

-- ── Sample projects (one per company) ───────────────────────────────────────

insert into public.projects (id, name, description, client_org_id, location, is_active)
values
  ('a0000000-0000-0000-0000-0000000000a2', 'Company A — Site 1', 'Pilot project for Company A', 'a0000000-0000-0000-0000-0000000000a1', 'Site A', true),
  ('b0000000-0000-0000-0000-0000000000b2', 'Company B — Site 1', 'Pilot project for Company B', 'b0000000-0000-0000-0000-0000000000b1', 'Site B', true)
on conflict (id) do nothing;

-- ── Bootstrap helpers ───────────────────────────────────────────────────────

-- Promote an existing auth user to platform system_admin (org-less, active).
create or replace function public.promote_to_system_admin(p_email text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid;
begin
  select id into v_uid from auth.users where email = p_email;
  if v_uid is null then
    raise exception 'No auth user found with email %', p_email;
  end if;
  update public.profiles
     set role = 'system_admin', status = 'active', organization_id = null, updated_at = now()
   where id = v_uid;
end;
$$;

-- Attach an existing auth user to an organization with a role and activate them.
create or replace function public.assign_to_org(
  p_email text,
  p_org_id uuid,
  p_role public.user_role
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid;
begin
  select id into v_uid from auth.users where email = p_email;
  if v_uid is null then
    raise exception 'No auth user found with email %', p_email;
  end if;
  update public.profiles
     set role = p_role, organization_id = p_org_id, status = 'active', updated_at = now()
   where id = v_uid;
end;
$$;
