-- Migration 006: RLS policies + helper functions

-- ============================================================
-- Helper functions (STABLE SECURITY DEFINER for per-transaction caching)
-- ============================================================

CREATE OR REPLACE FUNCTION public.auth_user_id()
RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auth_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auth_user_org_type()
RETURNS public.org_type AS $$
  SELECT o.org_type FROM public.organizations o
  INNER JOIN public.profiles p ON p.organization_id = o.id
  WHERE p.id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auth_is_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('system_admin', 'support') FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auth_is_client_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('system_admin', 'support', 'client_admin') FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- ORGANIZATIONS RLS
-- ============================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Everyone can read organizations (needed for dropdowns)
CREATE POLICY "organizations_select" ON public.organizations
  FOR SELECT USING (true);

-- Only system admins can insert/update/delete
CREATE POLICY "organizations_insert" ON public.organizations
  FOR INSERT WITH CHECK (public.auth_is_admin());

CREATE POLICY "organizations_update" ON public.organizations
  FOR UPDATE USING (public.auth_is_admin());

CREATE POLICY "organizations_delete" ON public.organizations
  FOR DELETE USING (public.auth_is_admin());

-- ============================================================
-- PROFILES RLS
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile, admins see all, client admins see their org
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR public.auth_is_admin()
    OR (public.auth_is_client_admin() AND organization_id = public.auth_user_org_id())
    OR organization_id = public.auth_user_org_id()
  );

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Admins can update any profile
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (public.auth_is_admin());

-- Client admins can update profiles in their org
CREATE POLICY "profiles_update_client_admin" ON public.profiles
  FOR UPDATE USING (
    public.auth_is_client_admin()
    AND organization_id = public.auth_user_org_id()
  );

-- ============================================================
-- PROJECTS RLS
-- ============================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- System admins see all projects
CREATE POLICY "projects_select_admin" ON public.projects
  FOR SELECT USING (public.auth_is_admin());

-- Client org members see their org's projects
CREATE POLICY "projects_select_client" ON public.projects
  FOR SELECT USING (
    public.auth_user_org_type() = 'client'
    AND client_org_id = public.auth_user_org_id()
  );

-- Contractor org members see projects they're assigned to
CREATE POLICY "projects_select_contractor" ON public.projects
  FOR SELECT USING (
    public.auth_user_org_type() = 'contractor'
    AND id IN (
      SELECT project_id FROM public.project_contractors
      WHERE contractor_org_id = public.auth_user_org_id()
    )
  );

-- Client admins/managers can create projects
CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT WITH CHECK (
    public.auth_is_admin()
    OR (
      public.auth_user_role() IN ('client_admin', 'client_manager')
      AND client_org_id = public.auth_user_org_id()
    )
  );

-- Client admins/managers can update their org's projects
CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (
    public.auth_is_admin()
    OR (
      public.auth_user_role() IN ('client_admin', 'client_manager')
      AND client_org_id = public.auth_user_org_id()
    )
  );

-- ============================================================
-- PROJECT_CONTRACTORS RLS
-- ============================================================
ALTER TABLE public.project_contractors ENABLE ROW LEVEL SECURITY;

-- Admins see all
CREATE POLICY "project_contractors_select_admin" ON public.project_contractors
  FOR SELECT USING (public.auth_is_admin());

-- Client members see their projects' contractors
CREATE POLICY "project_contractors_select_client" ON public.project_contractors
  FOR SELECT USING (
    public.auth_user_org_type() = 'client'
    AND project_id IN (
      SELECT id FROM public.projects WHERE client_org_id = public.auth_user_org_id()
    )
  );

-- Contractors see their own assignments
CREATE POLICY "project_contractors_select_contractor" ON public.project_contractors
  FOR SELECT USING (
    contractor_org_id = public.auth_user_org_id()
  );

-- Client admins/managers can manage contractors
CREATE POLICY "project_contractors_insert" ON public.project_contractors
  FOR INSERT WITH CHECK (
    public.auth_is_admin()
    OR (
      public.auth_user_role() IN ('client_admin', 'client_manager')
      AND project_id IN (
        SELECT id FROM public.projects WHERE client_org_id = public.auth_user_org_id()
      )
    )
  );

CREATE POLICY "project_contractors_delete" ON public.project_contractors
  FOR DELETE USING (
    public.auth_is_admin()
    OR (
      public.auth_user_role() IN ('client_admin', 'client_manager')
      AND project_id IN (
        SELECT id FROM public.projects WHERE client_org_id = public.auth_user_org_id()
      )
    )
  );

-- ============================================================
-- OBSERVATIONS RLS
-- ============================================================
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;

-- System admins see all
CREATE POLICY "observations_select_admin" ON public.observations
  FOR SELECT USING (public.auth_is_admin());

-- Client org sees ALL observations on their projects
CREATE POLICY "observations_select_client" ON public.observations
  FOR SELECT USING (
    public.auth_user_org_type() = 'client'
    AND project_id IN (
      SELECT id FROM public.projects WHERE client_org_id = public.auth_user_org_id()
    )
  );

-- Contractor org sees ONLY observations assigned to their org
CREATE POLICY "observations_select_contractor" ON public.observations
  FOR SELECT USING (
    public.auth_user_org_type() = 'contractor'
    AND assigned_org_id = public.auth_user_org_id()
  );

-- Client users can create observations on their projects
CREATE POLICY "observations_insert" ON public.observations
  FOR INSERT WITH CHECK (
    public.auth_is_admin()
    OR (
      public.auth_user_org_type() = 'client'
      AND creator_org_id = public.auth_user_org_id()
      AND project_id IN (
        SELECT id FROM public.projects WHERE client_org_id = public.auth_user_org_id()
      )
    )
  );

-- Client users can update observations on their projects
CREATE POLICY "observations_update_client" ON public.observations
  FOR UPDATE USING (
    public.auth_is_admin()
    OR (
      public.auth_user_org_type() = 'client'
      AND project_id IN (
        SELECT id FROM public.projects WHERE client_org_id = public.auth_user_org_id()
      )
    )
  );

-- Contractors can update status of observations assigned to them
CREATE POLICY "observations_update_contractor" ON public.observations
  FOR UPDATE USING (
    public.auth_user_org_type() = 'contractor'
    AND assigned_org_id = public.auth_user_org_id()
  );

-- ============================================================
-- OBSERVATION_RESPONSES RLS
-- ============================================================
ALTER TABLE public.observation_responses ENABLE ROW LEVEL SECURITY;

-- Admins see all
CREATE POLICY "responses_select_admin" ON public.observation_responses
  FOR SELECT USING (public.auth_is_admin());

-- Client sees responses on their observations
CREATE POLICY "responses_select_client" ON public.observation_responses
  FOR SELECT USING (
    public.auth_user_org_type() = 'client'
    AND observation_id IN (
      SELECT o.id FROM public.observations o
      INNER JOIN public.projects p ON o.project_id = p.id
      WHERE p.client_org_id = public.auth_user_org_id()
    )
  );

-- Contractor sees responses on observations assigned to them
CREATE POLICY "responses_select_contractor" ON public.observation_responses
  FOR SELECT USING (
    public.auth_user_org_type() = 'contractor'
    AND observation_id IN (
      SELECT id FROM public.observations WHERE assigned_org_id = public.auth_user_org_id()
    )
  );

-- Anyone who can see the observation can add a response
CREATE POLICY "responses_insert" ON public.observation_responses
  FOR INSERT WITH CHECK (
    responded_by = auth.uid()
    AND (
      public.auth_is_admin()
      OR observation_id IN (
        SELECT o.id FROM public.observations o
        INNER JOIN public.projects p ON o.project_id = p.id
        WHERE p.client_org_id = public.auth_user_org_id()
      )
      OR observation_id IN (
        SELECT id FROM public.observations WHERE assigned_org_id = public.auth_user_org_id()
      )
    )
  );

-- ============================================================
-- Storage bucket for observation photos
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('observation-photos', 'observation-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "observation_photos_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'observation-photos'
    AND auth.uid() IS NOT NULL
  );

-- Allow public read
CREATE POLICY "observation_photos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'observation-photos');
