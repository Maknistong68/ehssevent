-- ============================================================
-- MIGRATION 001: ENUMS
-- ============================================================
CREATE TYPE public.org_type AS ENUM ('client', 'contractor');

CREATE TYPE public.user_role AS ENUM (
  'system_admin', 'support', 'client_admin', 'client_manager', 'client_user', 'contractor_user'
);

CREATE TYPE public.observation_category AS ENUM (
  'unsafe_act', 'unsafe_condition', 'near_miss', 'environmental', 'positive_observation', 'other'
);

CREATE TYPE public.observation_priority AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE public.observation_status AS ENUM ('open', 'in_progress', 'pending_review', 'closed', 'overdue');

-- ============================================================
-- MIGRATION 002: ORGANIZATIONS
-- ============================================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  org_type public.org_type NOT NULL,
  logo_url TEXT,
  contact_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_org_type ON public.organizations (org_type);
CREATE INDEX idx_organizations_is_active ON public.organizations (is_active);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_organizations_updated
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- MIGRATION 003: PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role public.user_role NOT NULL DEFAULT 'client_user',
  organization_id UUID REFERENCES public.organizations(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_organization_id ON public.profiles (organization_id);
CREATE INDEX idx_profiles_role ON public.profiles (role);
CREATE INDEX idx_profiles_is_active ON public.profiles (is_active);
CREATE INDEX idx_profiles_email ON public.profiles (email);

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- MIGRATION 004: PROJECTS
-- ============================================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  client_org_id UUID NOT NULL REFERENCES public.organizations(id),
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_client_org_id ON public.projects (client_org_id);
CREATE INDEX idx_projects_is_active ON public.projects (is_active);

CREATE TRIGGER on_projects_updated
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.project_contractors (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  contractor_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, contractor_org_id)
);

CREATE INDEX idx_project_contractors_contractor ON public.project_contractors (contractor_org_id);
CREATE INDEX idx_project_contractors_project ON public.project_contractors (project_id);

-- ============================================================
-- MIGRATION 005: OBSERVATIONS
-- ============================================================
CREATE SEQUENCE public.observation_ref_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_observation_reference()
RETURNS TEXT AS $$
BEGIN
  RETURN 'OBS-' || EXTRACT(YEAR FROM now())::TEXT || '-' || LPAD(nextval('public.observation_ref_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE TABLE public.observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT NOT NULL UNIQUE DEFAULT public.generate_observation_reference(),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  creator_org_id UUID NOT NULL REFERENCES public.organizations(id),
  assigned_to UUID REFERENCES public.profiles(id),
  assigned_org_id UUID REFERENCES public.organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  category public.observation_category NOT NULL DEFAULT 'other',
  priority public.observation_priority NOT NULL DEFAULT 'medium',
  status public.observation_status NOT NULL DEFAULT 'open',
  photo_urls TEXT[] DEFAULT '{}',
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_observations_project_id ON public.observations (project_id);
CREATE INDEX idx_observations_created_by ON public.observations (created_by);
CREATE INDEX idx_observations_creator_org_id ON public.observations (creator_org_id);
CREATE INDEX idx_observations_assigned_to ON public.observations (assigned_to);
CREATE INDEX idx_observations_assigned_org_id ON public.observations (assigned_org_id);
CREATE INDEX idx_observations_status ON public.observations (status);
CREATE INDEX idx_observations_priority ON public.observations (priority);
CREATE INDEX idx_observations_category ON public.observations (category);
CREATE INDEX idx_observations_due_date ON public.observations (due_date);
CREATE INDEX idx_observations_reference ON public.observations (reference_number);

CREATE TRIGGER on_observations_updated
  BEFORE UPDATE ON public.observations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.observation_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  observation_id UUID NOT NULL REFERENCES public.observations(id) ON DELETE CASCADE,
  responded_by UUID NOT NULL REFERENCES public.profiles(id),
  responder_org_id UUID NOT NULL REFERENCES public.organizations(id),
  response_text TEXT NOT NULL,
  photo_urls TEXT[] DEFAULT '{}',
  is_closing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_observation_responses_observation ON public.observation_responses (observation_id);
CREATE INDEX idx_observation_responses_responded_by ON public.observation_responses (responded_by);
CREATE INDEX idx_observation_responses_responder_org ON public.observation_responses (responder_org_id);

-- ============================================================
-- MIGRATION 006: RLS + HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.auth_user_id()
RETURNS UUID AS $$ SELECT auth.uid(); $$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auth_user_org_id()
RETURNS UUID AS $$ SELECT organization_id FROM public.profiles WHERE id = auth.uid(); $$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS public.user_role AS $$ SELECT role FROM public.profiles WHERE id = auth.uid(); $$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auth_user_org_type()
RETURNS public.org_type AS $$
  SELECT o.org_type FROM public.organizations o
  INNER JOIN public.profiles p ON p.organization_id = o.id
  WHERE p.id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auth_is_admin()
RETURNS BOOLEAN AS $$ SELECT role IN ('system_admin', 'support') FROM public.profiles WHERE id = auth.uid(); $$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auth_is_client_admin()
RETURNS BOOLEAN AS $$ SELECT role IN ('system_admin', 'support', 'client_admin') FROM public.profiles WHERE id = auth.uid(); $$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Organizations RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizations_select" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "organizations_insert" ON public.organizations FOR INSERT WITH CHECK (public.auth_is_admin());
CREATE POLICY "organizations_update" ON public.organizations FOR UPDATE USING (public.auth_is_admin());
CREATE POLICY "organizations_delete" ON public.organizations FOR DELETE USING (public.auth_is_admin());

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (
  id = auth.uid() OR public.auth_is_admin()
  OR (public.auth_is_client_admin() AND organization_id = public.auth_user_org_id())
  OR organization_id = public.auth_user_org_id()
);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE USING (public.auth_is_admin());
CREATE POLICY "profiles_update_client_admin" ON public.profiles FOR UPDATE USING (
  public.auth_is_client_admin() AND organization_id = public.auth_user_org_id()
);

-- Projects RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_select_admin" ON public.projects FOR SELECT USING (public.auth_is_admin());
CREATE POLICY "projects_select_client" ON public.projects FOR SELECT USING (
  public.auth_user_org_type() = 'client' AND client_org_id = public.auth_user_org_id()
);
CREATE POLICY "projects_select_contractor" ON public.projects FOR SELECT USING (
  public.auth_user_org_type() = 'contractor' AND id IN (
    SELECT project_id FROM public.project_contractors WHERE contractor_org_id = public.auth_user_org_id()
  )
);
CREATE POLICY "projects_insert" ON public.projects FOR INSERT WITH CHECK (
  public.auth_is_admin() OR (
    public.auth_user_role() IN ('client_admin', 'client_manager') AND client_org_id = public.auth_user_org_id()
  )
);
CREATE POLICY "projects_update" ON public.projects FOR UPDATE USING (
  public.auth_is_admin() OR (
    public.auth_user_role() IN ('client_admin', 'client_manager') AND client_org_id = public.auth_user_org_id()
  )
);

-- Project Contractors RLS
ALTER TABLE public.project_contractors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_contractors_select_admin" ON public.project_contractors FOR SELECT USING (public.auth_is_admin());
CREATE POLICY "project_contractors_select_client" ON public.project_contractors FOR SELECT USING (
  public.auth_user_org_type() = 'client' AND project_id IN (
    SELECT id FROM public.projects WHERE client_org_id = public.auth_user_org_id()
  )
);
CREATE POLICY "project_contractors_select_contractor" ON public.project_contractors FOR SELECT USING (
  contractor_org_id = public.auth_user_org_id()
);
CREATE POLICY "project_contractors_insert" ON public.project_contractors FOR INSERT WITH CHECK (
  public.auth_is_admin() OR (
    public.auth_user_role() IN ('client_admin', 'client_manager') AND project_id IN (
      SELECT id FROM public.projects WHERE client_org_id = public.auth_user_org_id()
    )
  )
);
CREATE POLICY "project_contractors_delete" ON public.project_contractors FOR DELETE USING (
  public.auth_is_admin() OR (
    public.auth_user_role() IN ('client_admin', 'client_manager') AND project_id IN (
      SELECT id FROM public.projects WHERE client_org_id = public.auth_user_org_id()
    )
  )
);

-- Observations RLS
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "observations_select_admin" ON public.observations FOR SELECT USING (public.auth_is_admin());
CREATE POLICY "observations_select_client" ON public.observations FOR SELECT USING (
  public.auth_user_org_type() = 'client' AND project_id IN (
    SELECT id FROM public.projects WHERE client_org_id = public.auth_user_org_id()
  )
);
CREATE POLICY "observations_select_contractor" ON public.observations FOR SELECT USING (
  public.auth_user_org_type() = 'contractor' AND assigned_org_id = public.auth_user_org_id()
);
CREATE POLICY "observations_insert" ON public.observations FOR INSERT WITH CHECK (
  public.auth_is_admin() OR (
    public.auth_user_org_type() = 'client' AND creator_org_id = public.auth_user_org_id()
    AND project_id IN (SELECT id FROM public.projects WHERE client_org_id = public.auth_user_org_id())
  )
);
CREATE POLICY "observations_update_client" ON public.observations FOR UPDATE USING (
  public.auth_is_admin() OR (
    public.auth_user_org_type() = 'client' AND project_id IN (
      SELECT id FROM public.projects WHERE client_org_id = public.auth_user_org_id()
    )
  )
);
CREATE POLICY "observations_update_contractor" ON public.observations FOR UPDATE USING (
  public.auth_user_org_type() = 'contractor' AND assigned_org_id = public.auth_user_org_id()
);

-- Observation Responses RLS
ALTER TABLE public.observation_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "responses_select_admin" ON public.observation_responses FOR SELECT USING (public.auth_is_admin());
CREATE POLICY "responses_select_client" ON public.observation_responses FOR SELECT USING (
  public.auth_user_org_type() = 'client' AND observation_id IN (
    SELECT o.id FROM public.observations o INNER JOIN public.projects p ON o.project_id = p.id
    WHERE p.client_org_id = public.auth_user_org_id()
  )
);
CREATE POLICY "responses_select_contractor" ON public.observation_responses FOR SELECT USING (
  public.auth_user_org_type() = 'contractor' AND observation_id IN (
    SELECT id FROM public.observations WHERE assigned_org_id = public.auth_user_org_id()
  )
);
CREATE POLICY "responses_insert" ON public.observation_responses FOR INSERT WITH CHECK (
  responded_by = auth.uid() AND (
    public.auth_is_admin()
    OR observation_id IN (
      SELECT o.id FROM public.observations o INNER JOIN public.projects p ON o.project_id = p.id
      WHERE p.client_org_id = public.auth_user_org_id()
    )
    OR observation_id IN (
      SELECT id FROM public.observations WHERE assigned_org_id = public.auth_user_org_id()
    )
  )
);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('observation-photos', 'observation-photos', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "observation_photos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'observation-photos' AND auth.uid() IS NOT NULL);
CREATE POLICY "observation_photos_select" ON storage.objects FOR SELECT USING (bucket_id = 'observation-photos');

-- ============================================================
-- MOCK DATA: ORGANIZATIONS
-- ============================================================
INSERT INTO public.organizations (id, name, org_type, contact_email) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Acme Construction Ltd', 'client', 'admin@acmeconstruction.com'),
  ('b0000000-0000-0000-0000-000000000001', 'SafeBuild Contractors', 'contractor', 'info@safebuild.com'),
  ('b0000000-0000-0000-0000-000000000002', 'QuickFix Electrical', 'contractor', 'contact@quickfix.com'),
  ('b0000000-0000-0000-0000-000000000003', 'SteelWorks Inc', 'contractor', 'hello@steelworks.com');

-- ============================================================
-- MOCK DATA: AUTH USERS (password: password123 for all)
-- ============================================================
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at, confirmation_token, recovery_token)
VALUES
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'admin@acme.com',    crypt('password123', gen_salt('bf')), now(), '{"full_name":"John Admin"}'::jsonb,    'authenticated', 'authenticated', now(), now(), '', ''),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'manager@acme.com',  crypt('password123', gen_salt('bf')), now(), '{"full_name":"Sarah Manager"}'::jsonb,  'authenticated', 'authenticated', now(), now(), '', ''),
  ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'user@acme.com',     crypt('password123', gen_salt('bf')), now(), '{"full_name":"Mike User"}'::jsonb,     'authenticated', 'authenticated', now(), now(), '', ''),
  ('c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'bob@safebuild.com', crypt('password123', gen_salt('bf')), now(), '{"full_name":"Bob Builder"}'::jsonb,   'authenticated', 'authenticated', now(), now(), '', ''),
  ('c0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'alice@quickfix.com',crypt('password123', gen_salt('bf')), now(), '{"full_name":"Alice Sparks"}'::jsonb,  'authenticated', 'authenticated', now(), now(), '', ''),
  ('c0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'dave@steelworks.com',crypt('password123', gen_salt('bf')),now(), '{"full_name":"Dave Welder"}'::jsonb,   'authenticated', 'authenticated', now(), now(), '', '');

-- Also insert identities (required for email login to work)
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '{"sub":"c0000000-0000-0000-0000-000000000001","email":"admin@acme.com"}'::jsonb, 'email', now(), now(), now()),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', '{"sub":"c0000000-0000-0000-0000-000000000002","email":"manager@acme.com"}'::jsonb, 'email', now(), now(), now()),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', '{"sub":"c0000000-0000-0000-0000-000000000003","email":"user@acme.com"}'::jsonb, 'email', now(), now(), now()),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', '{"sub":"c0000000-0000-0000-0000-000000000004","email":"bob@safebuild.com"}'::jsonb, 'email', now(), now(), now()),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', '{"sub":"c0000000-0000-0000-0000-000000000005","email":"alice@quickfix.com"}'::jsonb, 'email', now(), now(), now()),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', '{"sub":"c0000000-0000-0000-0000-000000000006","email":"dave@steelworks.com"}'::jsonb, 'email', now(), now(), now());

-- ============================================================
-- MOCK DATA: UPDATE PROFILES (trigger auto-created them)
-- ============================================================
UPDATE public.profiles SET role = 'client_admin',    organization_id = 'a0000000-0000-0000-0000-000000000001', full_name = 'John Admin'    WHERE id = 'c0000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET role = 'client_manager',  organization_id = 'a0000000-0000-0000-0000-000000000001', full_name = 'Sarah Manager'  WHERE id = 'c0000000-0000-0000-0000-000000000002';
UPDATE public.profiles SET role = 'client_user',     organization_id = 'a0000000-0000-0000-0000-000000000001', full_name = 'Mike User'      WHERE id = 'c0000000-0000-0000-0000-000000000003';
UPDATE public.profiles SET role = 'contractor_user', organization_id = 'b0000000-0000-0000-0000-000000000001', full_name = 'Bob Builder'    WHERE id = 'c0000000-0000-0000-0000-000000000004';
UPDATE public.profiles SET role = 'contractor_user', organization_id = 'b0000000-0000-0000-0000-000000000002', full_name = 'Alice Sparks'   WHERE id = 'c0000000-0000-0000-0000-000000000005';
UPDATE public.profiles SET role = 'contractor_user', organization_id = 'b0000000-0000-0000-0000-000000000003', full_name = 'Dave Welder'    WHERE id = 'c0000000-0000-0000-0000-000000000006';

-- ============================================================
-- MOCK DATA: PROJECTS
-- ============================================================
INSERT INTO public.projects (id, name, description, client_org_id, location) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Highway Bridge Renovation', 'Major renovation of the I-95 overpass bridge including structural reinforcement and road resurfacing.', 'a0000000-0000-0000-0000-000000000001', 'I-95 Overpass, Section B'),
  ('d0000000-0000-0000-0000-000000000002', 'Industrial Park Expansion', 'Phase 2 expansion of the Greenfield Industrial Park, adding 3 new warehouse units.', 'a0000000-0000-0000-0000-000000000001', 'Greenfield Industrial Park'),
  ('d0000000-0000-0000-0000-000000000003', 'Office Tower Fit-Out', 'Interior fit-out of levels 5-10 of the new CBD office tower.', 'a0000000-0000-0000-0000-000000000001', 'CBD Tower, 100 Main St');

-- ============================================================
-- MOCK DATA: PROJECT CONTRACTORS
-- ============================================================
INSERT INTO public.project_contractors (project_id, contractor_org_id) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003'),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003');

-- ============================================================
-- MOCK DATA: OBSERVATIONS
-- ============================================================
INSERT INTO public.observations (project_id, created_by, creator_org_id, assigned_to, assigned_org_id, title, description, category, priority, status, due_date) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001',
   'Missing guardrail on scaffolding level 3',
   'Observed that the guardrail on the east side of scaffolding level 3 is missing. Workers were seen operating near the edge without fall protection.',
   'unsafe_condition', 'critical', 'open', CURRENT_DATE + 3),

  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001',
   'Worker not wearing hard hat in active zone',
   'A worker from SafeBuild was observed working without a hard hat in the active demolition zone near sector C.',
   'unsafe_act', 'high', 'in_progress', CURRENT_DATE + 5),

  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002',
   'Chemical spill near drainage point',
   'Hydraulic fluid leak from excavator has pooled near the stormwater drain inlet at grid reference E4.',
   'environmental', 'high', 'open', CURRENT_DATE + 2),

  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003',
   'Near miss - falling tools from height',
   'A wrench fell from level 8 and landed within 2 meters of a pedestrian walkway. No injuries but high potential severity.',
   'near_miss', 'critical', 'pending_review', CURRENT_DATE - 1),

  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002',
   'Excellent housekeeping on level 6',
   'QuickFix team maintained an exceptionally clean and organized workspace throughout the week. Good example for other teams.',
   'positive_observation', 'low', 'closed', NULL),

  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002',
   'Exposed electrical wiring in utility room',
   'Live wires found exposed without junction box cover in the utility room behind warehouse 2. Immediate fix needed.',
   'unsafe_condition', 'critical', 'in_progress', CURRENT_DATE + 1),

  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001',
   'Fire extinguisher expired - Zone B entrance',
   'The fire extinguisher at the Zone B entrance has an expired service tag (last serviced Jan 2025).',
   'unsafe_condition', 'medium', 'open', CURRENT_DATE + 7),

  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003',
   'Improper lifting technique observed',
   'Two workers were observed manually lifting heavy steel beams without using proper lifting aids or techniques.',
   'unsafe_act', 'medium', 'open', CURRENT_DATE + 5);

-- ============================================================
-- MOCK DATA: OBSERVATION RESPONSES
-- ============================================================
-- Get observation IDs by title for responses
DO $$
DECLARE
  obs_hardhat UUID;
  obs_tools UUID;
  obs_housekeeping UUID;
  obs_wiring UUID;
BEGIN
  SELECT id INTO obs_hardhat FROM public.observations WHERE title LIKE '%hard hat%' LIMIT 1;
  SELECT id INTO obs_tools FROM public.observations WHERE title LIKE '%falling tools%' LIMIT 1;
  SELECT id INTO obs_housekeeping FROM public.observations WHERE title LIKE '%housekeeping%' LIMIT 1;
  SELECT id INTO obs_wiring FROM public.observations WHERE title LIKE '%Exposed electrical%' LIMIT 1;

  IF obs_hardhat IS NOT NULL THEN
    INSERT INTO public.observation_responses (observation_id, responded_by, responder_org_id, response_text, is_closing)
    VALUES (obs_hardhat, 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001',
      'We have issued a toolbox talk to all workers on site regarding mandatory PPE. The worker in question has been counseled and provided with a replacement hard hat.', false);
  END IF;

  IF obs_tools IS NOT NULL THEN
    INSERT INTO public.observation_responses (observation_id, responded_by, responder_org_id, response_text, is_closing, created_at)
    VALUES
      (obs_tools, 'c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003',
       'We have installed tool lanyards on all hand tools and added mesh barriers along the edge of each working level. A site-wide briefing was conducted.', false, now() - interval '2 hours'),
      (obs_tools, 'c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003',
       'All corrective actions have been implemented and verified by our site supervisor. Requesting closure of this observation.', true, now() - interval '1 hour');
  END IF;

  IF obs_housekeeping IS NOT NULL THEN
    INSERT INTO public.observation_responses (observation_id, responded_by, responder_org_id, response_text, is_closing)
    VALUES (obs_housekeeping, 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002',
      'Thank you for the recognition! We will continue to maintain high standards of housekeeping across all our work areas.', false);
  END IF;

  IF obs_wiring IS NOT NULL THEN
    INSERT INTO public.observation_responses (observation_id, responded_by, responder_org_id, response_text, is_closing)
    VALUES (obs_wiring, 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002',
      'Area has been cordoned off and de-energized. Replacement junction box covers have been ordered and will be installed tomorrow morning.', false);
  END IF;
END $$;

-- ============================================================
-- MIGRATION 008: EVENTS
-- ============================================================
CREATE TYPE public.event_approval_level AS ENUM (
  'draft', 'contractor_review', 'review', 'contractor_investigation',
  'investigation', 'validation', 'approval', 'closed'
);

CREATE TYPE public.event_type AS ENUM (
  'incident', 'near_miss', 'hazard_identification', 'positive_observation', 'leadership_event'
);

CREATE TYPE public.event_classification AS ENUM (
  'safety', 'fire', 'environment', 'welfare', 'unsafe_act', 'unsafe_condition',
  'non_conformance', 'positive_observation', 'leadership_site_visit', 'emergency_drill',
  'safety_meeting', 'contractor_performance_review', 'to_be_determined'
);

CREATE TYPE public.event_significant_hazard AS ENUM (
  'mobile_plant_equipment', 'driving', 'working_near_live_roads', 'breaking_ground_excavations',
  'work_at_height', 'lifting', 'confined_spaces', 'fire', 'hot_works', 'energised_systems',
  'temporary_works', 'drilling_blasting', 'working_near_water', 'working_in_heat', 'other'
);

CREATE TYPE public.event_impacted_party AS ENUM ('client', 'contractor', 'visitor');

CREATE SEQUENCE public.event_ref_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_event_reference()
RETURNS TEXT AS $$
BEGIN
  RETURN 'EVT-' || EXTRACT(YEAR FROM now())::TEXT || '-' || LPAD(nextval('public.event_ref_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT NOT NULL UNIQUE DEFAULT public.generate_event_reference(),
  project_id UUID REFERENCES public.projects(id),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  creator_org_id UUID NOT NULL REFERENCES public.organizations(id),
  approval_level public.event_approval_level NOT NULL DEFAULT 'draft',
  type public.event_type NOT NULL,
  was_fire BOOLEAN NOT NULL DEFAULT false,
  was_injury BOOLEAN NOT NULL DEFAULT false,
  was_environment_impacted BOOLEAN NOT NULL DEFAULT false,
  classification public.event_classification NOT NULL DEFAULT 'to_be_determined',
  site TEXT,
  contractor TEXT,
  specific_area TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  event_date TIMESTAMPTZ,
  reported_date TIMESTAMPTZ,
  work_related BOOLEAN NOT NULL DEFAULT true,
  impacted_party public.event_impacted_party,
  leadership_member_name TEXT,
  attendees TEXT,
  notify_attendees_by_email BOOLEAN NOT NULL DEFAULT false,
  event_description TEXT,
  conditions TEXT,
  significant_hazard public.event_significant_hazard,
  repeat_incident BOOLEAN NOT NULL DEFAULT false,
  immediate_corrective_actions TEXT,
  stop_work BOOLEAN NOT NULL DEFAULT false,
  stop_work_details TEXT,
  further_action_required BOOLEAN NOT NULL DEFAULT false,
  photo_urls TEXT[] DEFAULT '{}',
  contractor_reviewer TEXT,
  reviewer TEXT,
  contractor_investigator TEXT,
  lead_investigator TEXT,
  validator TEXT,
  approver TEXT,
  created_by_name TEXT,
  closeout_photo_urls TEXT[] DEFAULT '{}',
  date_closure TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_project_id ON public.events (project_id);
CREATE INDEX idx_events_created_by ON public.events (created_by);
CREATE INDEX idx_events_creator_org_id ON public.events (creator_org_id);
CREATE INDEX idx_events_approval_level ON public.events (approval_level);
CREATE INDEX idx_events_type ON public.events (type);
CREATE INDEX idx_events_classification ON public.events (classification);
CREATE INDEX idx_events_significant_hazard ON public.events (significant_hazard);
CREATE INDEX idx_events_event_date ON public.events (event_date);
CREATE INDEX idx_events_reference ON public.events (reference_number);

CREATE TRIGGER on_events_updated
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- MIGRATION 009: EVENTS RLS + STORAGE
-- ============================================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_admin" ON public.events
  FOR SELECT USING (public.auth_is_admin());

CREATE POLICY "events_select_client" ON public.events
  FOR SELECT USING (
    public.auth_user_org_type() = 'client'
    AND (
      creator_org_id = public.auth_user_org_id()
      OR project_id IN (SELECT id FROM public.projects WHERE client_org_id = public.auth_user_org_id())
    )
  );

CREATE POLICY "events_select_contractor" ON public.events
  FOR SELECT USING (
    public.auth_user_org_type() = 'contractor'
    AND creator_org_id = public.auth_user_org_id()
  );

CREATE POLICY "events_insert" ON public.events
  FOR INSERT WITH CHECK (
    public.auth_is_admin()
    OR (created_by = auth.uid() AND creator_org_id = public.auth_user_org_id())
  );

CREATE POLICY "events_update_admin" ON public.events
  FOR UPDATE USING (public.auth_is_admin());

CREATE POLICY "events_update_client" ON public.events
  FOR UPDATE USING (
    public.auth_user_org_type() = 'client'
    AND (
      creator_org_id = public.auth_user_org_id()
      OR project_id IN (SELECT id FROM public.projects WHERE client_org_id = public.auth_user_org_id())
    )
  );

CREATE POLICY "events_update_contractor" ON public.events
  FOR UPDATE USING (
    public.auth_user_org_type() = 'contractor'
    AND creator_org_id = public.auth_user_org_id()
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "event_photos_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'event-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "event_photos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-photos');

-- ============================================================
-- MIGRATION 010: CORRECTIVE ACTIONS
-- ============================================================
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS was_security BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS impact_other TEXT;

CREATE TYPE public.corrective_action_status AS ENUM (
  'open',
  'in_progress',
  'pending_approval',
  'approved',
  'rejected'
);

CREATE TYPE public.corrective_action_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE SEQUENCE public.corrective_action_ref_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_corrective_action_reference()
RETURNS TEXT AS $$
BEGIN
  RETURN 'CA-' || EXTRACT(YEAR FROM now())::TEXT || '-' || LPAD(nextval('public.corrective_action_ref_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE TABLE public.corrective_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT NOT NULL UNIQUE DEFAULT public.generate_corrective_action_reference(),
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  creator_org_id UUID NOT NULL REFERENCES public.organizations(id),
  assigned_to UUID REFERENCES public.profiles(id),
  approver_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  priority public.corrective_action_priority NOT NULL DEFAULT 'medium',
  status public.corrective_action_status NOT NULL DEFAULT 'open',
  due_date DATE,
  photo_urls TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_corrective_actions_event_id ON public.corrective_actions (event_id);
CREATE INDEX idx_corrective_actions_project_id ON public.corrective_actions (project_id);
CREATE INDEX idx_corrective_actions_created_by ON public.corrective_actions (created_by);
CREATE INDEX idx_corrective_actions_creator_org_id ON public.corrective_actions (creator_org_id);
CREATE INDEX idx_corrective_actions_assigned_to ON public.corrective_actions (assigned_to);
CREATE INDEX idx_corrective_actions_approver_id ON public.corrective_actions (approver_id);
CREATE INDEX idx_corrective_actions_status ON public.corrective_actions (status);
CREATE INDEX idx_corrective_actions_due_date ON public.corrective_actions (due_date);
CREATE INDEX idx_corrective_actions_reference ON public.corrective_actions (reference_number);

CREATE TRIGGER on_corrective_actions_updated
  BEFORE UPDATE ON public.corrective_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- MIGRATION 011: CORRECTIVE ACTIONS RLS
-- ============================================================
ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "corrective_actions_select" ON public.corrective_actions
  FOR SELECT USING (
    public.auth_is_admin()
    OR creator_org_id = public.auth_user_org_id()
    OR assigned_to = auth.uid()
    OR approver_id = auth.uid()
  );

CREATE POLICY "corrective_actions_insert" ON public.corrective_actions
  FOR INSERT WITH CHECK (
    public.auth_is_admin()
    OR (
      created_by = auth.uid()
      AND creator_org_id = public.auth_user_org_id()
    )
  );

CREATE POLICY "corrective_actions_update" ON public.corrective_actions
  FOR UPDATE USING (
    public.auth_is_admin()
    OR created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR approver_id = auth.uid()
  );

-- ============================================================
-- MIGRATION 012: COMPLIANCE FIELD TYPE
-- IMPORTANT: Postgres cannot add an enum value and use it in the same
-- transaction. Run THIS statement on its own (commit) before running 013-015.
-- ============================================================
ALTER TYPE public.inspection_field_type ADD VALUE IF NOT EXISTS 'compliance';

-- ============================================================
-- MIGRATION 013: CORRECTIVE ACTIONS INSPECTION LINK
-- ============================================================
ALTER TABLE public.corrective_actions
  ADD COLUMN IF NOT EXISTS inspection_id UUID REFERENCES public.inspections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS section_id TEXT,
  ADD COLUMN IF NOT EXISTS item_id TEXT,
  ADD COLUMN IF NOT EXISTS item_label TEXT;

CREATE INDEX IF NOT EXISTS idx_corrective_actions_inspection_id
  ON public.corrective_actions (inspection_id);

-- ============================================================
-- MIGRATION 014: EVENT RESPONSES
-- ============================================================
CREATE TABLE public.event_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  responded_by UUID NOT NULL REFERENCES public.profiles(id),
  responder_org_id UUID NOT NULL REFERENCES public.organizations(id),
  response_text TEXT NOT NULL,
  photo_urls TEXT[] DEFAULT '{}',
  is_closing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_responses_event ON public.event_responses (event_id);
CREATE INDEX idx_event_responses_responded_by ON public.event_responses (responded_by);
CREATE INDEX idx_event_responses_responder_org ON public.event_responses (responder_org_id);

ALTER TABLE public.event_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_responses_select_admin" ON public.event_responses
  FOR SELECT USING (public.auth_is_admin());

CREATE POLICY "event_responses_select_client" ON public.event_responses
  FOR SELECT USING (
    public.auth_user_org_type() = 'client'
    AND event_id IN (
      SELECT e.id FROM public.events e
      WHERE e.creator_org_id = public.auth_user_org_id()
        OR e.project_id IN (
          SELECT id FROM public.projects WHERE client_org_id = public.auth_user_org_id()
        )
    )
  );

CREATE POLICY "event_responses_select_contractor" ON public.event_responses
  FOR SELECT USING (
    public.auth_user_org_type() = 'contractor'
    AND event_id IN (
      SELECT id FROM public.events WHERE creator_org_id = public.auth_user_org_id()
    )
  );

CREATE POLICY "event_responses_insert" ON public.event_responses
  FOR INSERT WITH CHECK (
    responded_by = auth.uid()
    AND (
      public.auth_is_admin()
      OR event_id IN (
        SELECT e.id FROM public.events e
        WHERE e.creator_org_id = public.auth_user_org_id()
          OR e.project_id IN (
            SELECT id FROM public.projects WHERE client_org_id = public.auth_user_org_id()
          )
      )
    )
  );

-- ============================================================
-- MIGRATION 015: DROP OBSERVATIONS (run last)
-- ============================================================
DROP TABLE IF EXISTS public.observation_responses CASCADE;
DROP TABLE IF EXISTS public.observations CASCADE;
DROP FUNCTION IF EXISTS public.generate_observation_reference() CASCADE;
DROP SEQUENCE IF EXISTS public.observation_ref_seq CASCADE;
DROP TYPE IF EXISTS public.observation_status CASCADE;
DROP TYPE IF EXISTS public.observation_priority CASCADE;
DROP TYPE IF EXISTS public.observation_category CASCADE;
