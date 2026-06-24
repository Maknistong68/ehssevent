-- ============================================================================
-- 0001_schema.sql — Event Report core schema
--
-- Mirrors src/types/database.ts and src/types/enums.ts exactly so the app's
-- TypeScript types and the database stay in lock-step. Run this first, then
-- 0002_rls.sql, then seed.sql.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── Enums (mirror src/types/enums.ts) ───────────────────────────────────────

create type public.org_type as enum ('client', 'contractor');

create type public.user_role as enum (
  'system_admin', 'support', 'client_admin',
  'client_manager', 'client_user', 'contractor_user'
);

create type public.user_status as enum ('invited', 'pending', 'active', 'deactivated');

create type public.inspection_field_type as enum (
  'text', 'yes_no', 'pass_fail', 'numeric', 'photo', 'dropdown', 'compliance'
);

create type public.inspection_status as enum ('draft', 'completed');

create type public.event_approval_level as enum (
  'draft', 'contractor_review', 'review', 'contractor_investigation',
  'investigation', 'validation', 'approval', 'closed'
);

create type public.event_type as enum (
  'incident', 'near_miss', 'hazard_identification',
  'positive_observation', 'leadership_event'
);

create type public.event_classification as enum (
  'safety', 'security', 'fire', 'environment', 'welfare', 'unsafe_act',
  'unsafe_condition', 'non_conformance', 'positive_observation',
  'leadership_site_visit', 'emergency_drill', 'safety_meeting',
  'contractor_performance_review'
);

create type public.event_significant_hazard as enum (
  'mobile_plant_equipment', 'driving', 'working_near_live_roads',
  'breaking_ground_excavations', 'work_at_height', 'lifting', 'confined_spaces',
  'fire', 'hot_works', 'energised_systems', 'temporary_works',
  'drilling_blasting', 'working_near_water', 'working_in_heat', 'other'
);

create type public.event_impacted_party as enum ('client', 'contractor', 'visitor');

create type public.corrective_action_status as enum (
  'open', 'in_progress', 'pending_approval', 'approved', 'rejected'
);

create type public.corrective_action_priority as enum ('low', 'medium', 'high', 'critical');

create type public.dsr_type as enum ('access', 'copy', 'correction', 'destruction');
create type public.dsr_status as enum ('received', 'in_progress', 'completed', 'rejected');

create type public.notification_type as enum (
  'ca_assigned', 'ca_approved', 'ca_rejected', 'ca_submitted',
  'event_stage_changed', 'deadline_approaching'
);

-- ── Shared updated_at trigger ───────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── organizations ───────────────────────────────────────────────────────────

create table public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  org_type      public.org_type not null,
  logo_url      text,
  contact_email text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_organizations_updated
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- ── profiles (1:1 with auth.users) ──────────────────────────────────────────

create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  username            text unique not null,
  email               text,
  full_name           text,
  role                public.user_role not null default 'client_user',
  organization_id     uuid references public.organizations(id) on delete set null,
  status              public.user_status not null default 'pending',
  terms_accepted_at   timestamptz,
  privacy_accepted_at timestamptz,
  terms_version       text,
  privacy_version     text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index idx_profiles_org on public.profiles(organization_id);
create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── projects ────────────────────────────────────────────────────────────────

create table public.projects (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  client_org_id uuid not null references public.organizations(id) on delete cascade,
  location     text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index idx_projects_client_org on public.projects(client_org_id);
create trigger trg_projects_updated
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ── project_contractors (junction) ──────────────────────────────────────────

create table public.project_contractors (
  project_id        uuid not null references public.projects(id) on delete cascade,
  contractor_org_id uuid not null references public.organizations(id) on delete cascade,
  created_at        timestamptz not null default now(),
  primary key (project_id, contractor_org_id)
);
create index idx_project_contractors_contractor on public.project_contractors(contractor_org_id);

-- ── events ──────────────────────────────────────────────────────────────────

create table public.events (
  id                          uuid primary key default gen_random_uuid(),
  reference_number            text not null unique,
  project_id                  uuid references public.projects(id) on delete set null,
  created_by                  uuid not null references public.profiles(id) on delete restrict,
  creator_org_id              uuid not null references public.organizations(id) on delete restrict,
  approval_level              public.event_approval_level not null default 'draft',
  type                        public.event_type not null,
  was_fire                    boolean not null default false,
  was_injury                  boolean not null default false,
  was_environment_impacted    boolean not null default false,
  was_security                boolean not null default false,
  impact_other                text,
  classification              public.event_classification,
  site                        text,
  contractor                  text,
  specific_area               text,
  latitude                    double precision,
  longitude                   double precision,
  event_date                  timestamptz,
  reported_date               timestamptz,
  work_related                boolean not null default false,
  impacted_party              public.event_impacted_party,
  leadership_member_id        uuid references public.profiles(id) on delete set null,
  attendees                   text[] not null default '{}',
  notify_attendees_by_email   boolean not null default false,
  event_description           text,
  conditions                  text,
  significant_hazard          public.event_significant_hazard,
  repeat_incident             boolean not null default false,
  immediate_corrective_actions text,
  stop_work                   boolean not null default false,
  stop_work_details           text,
  further_action_required     boolean not null default false,
  photo_urls                  text[] not null default '{}',
  contractor_reviewer_id      uuid references public.profiles(id) on delete set null,
  reviewer_id                 uuid references public.profiles(id) on delete set null,
  contractor_investigator_id  uuid references public.profiles(id) on delete set null,
  lead_investigator_id        uuid references public.profiles(id) on delete set null,
  validator_id                uuid references public.profiles(id) on delete set null,
  approver_id                 uuid references public.profiles(id) on delete set null,
  closeout_photo_urls         text[] not null default '{}',
  date_closure                timestamptz,
  client_closeout_approved_at timestamptz,
  client_closeout_approved_by uuid references public.profiles(id) on delete set null,
  reporting_deadline_24h      timestamptz,
  reporting_deadline_3day     timestamptz,
  deadline_24h_met            boolean not null default false,
  deadline_3day_met           boolean not null default false,
  deadline_24h_met_at         timestamptz,
  deadline_3day_met_at        timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index idx_events_creator_org on public.events(creator_org_id);
create index idx_events_project on public.events(project_id);
create index idx_events_approval_level on public.events(approval_level);
create index idx_events_event_date on public.events(event_date);
create trigger trg_events_updated
  before update on public.events
  for each row execute function public.set_updated_at();

-- ── event_responses ─────────────────────────────────────────────────────────

create table public.event_responses (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references public.events(id) on delete cascade,
  responded_by     uuid not null references public.profiles(id) on delete restrict,
  responder_org_id uuid not null references public.organizations(id) on delete restrict,
  response_text    text not null,
  photo_urls       text[] not null default '{}',
  is_closing       boolean not null default false,
  created_at       timestamptz not null default now()
);
create index idx_event_responses_event on public.event_responses(event_id);

-- ── corrective_actions ──────────────────────────────────────────────────────

create table public.corrective_actions (
  id               uuid primary key default gen_random_uuid(),
  reference_number text not null unique,
  event_id         uuid references public.events(id) on delete set null,
  inspection_id    uuid,
  section_id       text,
  item_id          text,
  item_label       text,
  project_id       uuid references public.projects(id) on delete set null,
  created_by       uuid not null references public.profiles(id) on delete restrict,
  creator_org_id   uuid not null references public.organizations(id) on delete restrict,
  assigned_to      uuid references public.profiles(id) on delete set null,
  approver_id      uuid references public.profiles(id) on delete set null,
  title            text not null,
  description      text,
  priority         public.corrective_action_priority not null default 'medium',
  status           public.corrective_action_status not null default 'open',
  due_date         timestamptz,
  photo_urls       text[] not null default '{}',
  completed_at     timestamptz,
  approved_at      timestamptz,
  rejection_reason text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index idx_ca_creator_org on public.corrective_actions(creator_org_id);
create index idx_ca_event on public.corrective_actions(event_id);
create index idx_ca_assigned on public.corrective_actions(assigned_to);
create trigger trg_ca_updated
  before update on public.corrective_actions
  for each row execute function public.set_updated_at();

-- ── inspection_templates ────────────────────────────────────────────────────
-- sections (TemplateSection[]) are stored as jsonb to keep the nested
-- section→item shape from src/types/database.ts intact.

create table public.inspection_templates (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  description     text,
  sections        jsonb not null default '[]',
  is_active       boolean not null default true,
  created_by      uuid not null references public.profiles(id) on delete restrict,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_templates_org on public.inspection_templates(organization_id);
create trigger trg_templates_updated
  before update on public.inspection_templates
  for each row execute function public.set_updated_at();

-- ── inspections ─────────────────────────────────────────────────────────────

create table public.inspections (
  id               uuid primary key default gen_random_uuid(),
  reference_number text not null unique,
  template_id      uuid not null references public.inspection_templates(id) on delete restrict,
  project_id       uuid not null references public.projects(id) on delete restrict,
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  conducted_by     uuid not null references public.profiles(id) on delete restrict,
  status           public.inspection_status not null default 'draft',
  score            double precision,
  total_items      integer not null default 0,
  scorable_items   integer not null default 0,
  compliant_items  integer not null default 0,
  notes            text,
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index idx_inspections_org on public.inspections(organization_id);
create index idx_inspections_project on public.inspections(project_id);
create trigger trg_inspections_updated
  before update on public.inspections
  for each row execute function public.set_updated_at();

-- add the inspection_id FK on corrective_actions now that inspections exists
alter table public.corrective_actions
  add constraint corrective_actions_inspection_fk
  foreign key (inspection_id) references public.inspections(id) on delete set null;

-- ── inspection_responses ────────────────────────────────────────────────────

create table public.inspection_responses (
  id            uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  section_id    text not null,
  item_id       text not null,
  field_type    public.inspection_field_type not null,
  value         text,
  comment       text,
  photo_urls    text[] not null default '{}',
  created_at    timestamptz not null default now()
);
create index idx_inspection_responses_inspection on public.inspection_responses(inspection_id);

-- ── notifications ───────────────────────────────────────────────────────────

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       public.notification_type not null,
  title      text not null,
  body       text,
  link       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on public.notifications(user_id);

-- ── notification_preferences ────────────────────────────────────────────────

create table public.notification_preferences (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  ca_assigned boolean not null default true,
  ca_status   boolean not null default true,
  event_stage boolean not null default true
);

-- ── dsr_requests (PDPL Data Subject Requests) ───────────────────────────────

create table public.dsr_requests (
  id              uuid primary key default gen_random_uuid(),
  requester_id    uuid not null references public.profiles(id) on delete cascade,
  requester_email text not null,
  type            public.dsr_type not null,
  note            text,
  status          public.dsr_status not null default 'received',
  created_at      timestamptz not null default now(),
  due_at          timestamptz not null,
  resolved_at     timestamptz
);
create index idx_dsr_requester on public.dsr_requests(requester_id);

-- ── audit_logs (append-only) ────────────────────────────────────────────────
-- organization_id scopes rows for RLS; it is not part of AuditLogEntry in the
-- app types (queries simply don't select it).

create table public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  actor_id        uuid references public.profiles(id) on delete set null,
  actor_email     text,
  action          text not null,
  target_table    text,
  target_id       text,
  target_label    text,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now()
);
create index idx_audit_org on public.audit_logs(organization_id);
create index idx_audit_target on public.audit_logs(target_table, target_id);
create index idx_audit_created on public.audit_logs(created_at desc);

-- Append-only enforcement: block UPDATE and DELETE at the database level so the
-- audit trail is immutable even for the table owner.
create or replace function public.audit_logs_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_logs is append-only';
end;
$$;
create trigger trg_audit_no_update
  before update on public.audit_logs
  for each row execute function public.audit_logs_immutable();
create trigger trg_audit_no_delete
  before delete on public.audit_logs
  for each row execute function public.audit_logs_immutable();

-- ── New-user handler: auto-create a pending profile for each auth user ───────
-- Self-signups land as `pending` client_user with no org until an admin
-- approves them (assigning role + organization + flipping status to active).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, username, email, full_name, role, organization_id, status,
    terms_accepted_at, privacy_accepted_at, terms_version, privacy_version
  )
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'username', ''),
      split_part(coalesce(new.email, 'user'), '@', 1)
    ),
    new.email,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    'client_user',
    null,
    'pending',
    case when new.raw_user_meta_data ? 'terms_version' then now() end,
    case when new.raw_user_meta_data ? 'privacy_version' then now() end,
    nullif(new.raw_user_meta_data->>'terms_version', ''),
    nullif(new.raw_user_meta_data->>'privacy_version', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
