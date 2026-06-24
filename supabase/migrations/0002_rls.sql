-- ============================================================================
-- 0002_rls.sql — Row Level Security
--
-- THE #1 PILOT REQUIREMENT: Company A must never see Company B's data.
-- Every table below has RLS enabled and policies that scope rows to the
-- caller's organization (resolved from their profile), with platform admins
-- (system_admin / support) able to see everything.
--
-- The helper functions are SECURITY DEFINER so they read `profiles` without
-- being subject to RLS themselves — this avoids infinite policy recursion.
-- ============================================================================

create or replace function public.auth_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

create or replace function public.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('system_admin', 'support')
  );
$$;

-- Projects owned (as client) by the caller's organization. Used to let a client
-- org see contractor-created events/CAs that sit on the client's projects.
create or replace function public.auth_project_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.projects where client_org_id = public.auth_org_id();
$$;

-- ── Enable RLS everywhere ───────────────────────────────────────────────────

alter table public.organizations          enable row level security;
alter table public.profiles                enable row level security;
alter table public.projects                enable row level security;
alter table public.project_contractors     enable row level security;
alter table public.events                  enable row level security;
alter table public.event_responses         enable row level security;
alter table public.corrective_actions      enable row level security;
alter table public.inspection_templates    enable row level security;
alter table public.inspections             enable row level security;
alter table public.inspection_responses    enable row level security;
alter table public.notifications           enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.dsr_requests            enable row level security;
alter table public.audit_logs              enable row level security;

-- ── organizations ───────────────────────────────────────────────────────────
-- A user can read their own organization; platform admins read all. Writes are
-- admin-only (handled via the service-role admin client, which bypasses RLS).

create policy organizations_select on public.organizations
  for select using (
    public.is_platform_admin() or id = public.auth_org_id()
  );

-- ── profiles ────────────────────────────────────────────────────────────────
-- Read your own profile (required for session/role resolution), profiles in
-- your org, or everything if platform admin. Users may update only their own
-- profile; role/org/status changes are done via the admin client.

create policy profiles_select on public.profiles
  for select using (
    public.is_platform_admin()
    or id = auth.uid()
    or organization_id = public.auth_org_id()
  );

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ── projects ────────────────────────────────────────────────────────────────
-- Visible to the owning client org, to contractor orgs assigned to the project,
-- and to platform admins.

create policy projects_select on public.projects
  for select using (
    public.is_platform_admin()
    or client_org_id = public.auth_org_id()
    or id in (
      select project_id from public.project_contractors
      where contractor_org_id = public.auth_org_id()
    )
  );

-- ── project_contractors ─────────────────────────────────────────────────────

create policy project_contractors_select on public.project_contractors
  for select using (
    public.is_platform_admin()
    or contractor_org_id = public.auth_org_id()
    or project_id in (select public.auth_project_ids())
  );

-- ── events ──────────────────────────────────────────────────────────────────
-- Visible to the creator org, to the client org that owns the event's project,
-- and to platform admins. This is the core isolation boundary.

create policy events_select on public.events
  for select using (
    public.is_platform_admin()
    or creator_org_id = public.auth_org_id()
    or project_id in (select public.auth_project_ids())
  );

create policy events_insert on public.events
  for insert with check (
    created_by = auth.uid()
    and creator_org_id = public.auth_org_id()
  );

create policy events_update on public.events
  for update using (
    public.is_platform_admin()
    or creator_org_id = public.auth_org_id()
    or project_id in (select public.auth_project_ids())
  );

-- ── event_responses ─────────────────────────────────────────────────────────
-- Tied to event visibility; a user may respond on any event they can see.

create policy event_responses_select on public.event_responses
  for select using (
    event_id in (select id from public.events)
  );

create policy event_responses_insert on public.event_responses
  for insert with check (
    responded_by = auth.uid()
    and responder_org_id = public.auth_org_id()
    and event_id in (select id from public.events)
  );

-- ── corrective_actions ──────────────────────────────────────────────────────

create policy corrective_actions_select on public.corrective_actions
  for select using (
    public.is_platform_admin()
    or creator_org_id = public.auth_org_id()
    or assigned_to = auth.uid()
    or project_id in (select public.auth_project_ids())
  );

create policy corrective_actions_insert on public.corrective_actions
  for insert with check (
    created_by = auth.uid()
    and creator_org_id = public.auth_org_id()
  );

create policy corrective_actions_update on public.corrective_actions
  for update using (
    public.is_platform_admin()
    or creator_org_id = public.auth_org_id()
    or assigned_to = auth.uid()
    or project_id in (select public.auth_project_ids())
  );

-- ── inspection_templates ────────────────────────────────────────────────────

create policy inspection_templates_select on public.inspection_templates
  for select using (
    public.is_platform_admin() or organization_id = public.auth_org_id()
  );

create policy inspection_templates_insert on public.inspection_templates
  for insert with check (
    organization_id = public.auth_org_id() and created_by = auth.uid()
  );

create policy inspection_templates_update on public.inspection_templates
  for update using (
    public.is_platform_admin() or organization_id = public.auth_org_id()
  );

-- ── inspections ─────────────────────────────────────────────────────────────

create policy inspections_select on public.inspections
  for select using (
    public.is_platform_admin() or organization_id = public.auth_org_id()
  );

create policy inspections_insert on public.inspections
  for insert with check (
    organization_id = public.auth_org_id() and conducted_by = auth.uid()
  );

create policy inspections_update on public.inspections
  for update using (
    public.is_platform_admin() or organization_id = public.auth_org_id()
  );

-- ── inspection_responses ────────────────────────────────────────────────────

create policy inspection_responses_select on public.inspection_responses
  for select using (
    inspection_id in (select id from public.inspections)
  );

create policy inspection_responses_insert on public.inspection_responses
  for insert with check (
    inspection_id in (select id from public.inspections)
  );

create policy inspection_responses_update on public.inspection_responses
  for update using (
    inspection_id in (select id from public.inspections)
  );

-- ── notifications (private per recipient) ───────────────────────────────────

create policy notifications_select on public.notifications
  for select using (user_id = auth.uid());

create policy notifications_update on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── notification_preferences (private per user) ─────────────────────────────

create policy notification_preferences_all on public.notification_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── dsr_requests ────────────────────────────────────────────────────────────
-- A user sees their own requests; platform admins (acting as DPO) see all.

create policy dsr_select on public.dsr_requests
  for select using (
    public.is_platform_admin() or requester_id = auth.uid()
  );

create policy dsr_insert on public.dsr_requests
  for insert with check (requester_id = auth.uid());

-- ── audit_logs ──────────────────────────────────────────────────────────────
-- Read-only to the app: writes happen through the service-role admin client.
-- A user sees audit rows for their own organization; platform admins see all.

create policy audit_logs_select on public.audit_logs
  for select using (
    public.is_platform_admin() or organization_id = public.auth_org_id()
  );

-- ============================================================================
-- Storage: the `observation-photos` bucket for event / inspection / CA photos.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('observation-photos', 'observation-photos', true)
on conflict (id) do nothing;

-- Any authenticated user may upload to the bucket; anyone may read (public
-- bucket → durable public URLs). Tighten to org-scoped paths post-pilot.
create policy "observation_photos_read" on storage.objects
  for select using (bucket_id = 'observation-photos');

create policy "observation_photos_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'observation-photos');
