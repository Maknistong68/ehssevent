-- Migration 007: Inspection module — templates, inspections, responses

-- ============================================================
-- New enums
-- ============================================================

CREATE TYPE public.inspection_field_type AS ENUM (
  'text',
  'yes_no',
  'pass_fail',
  'numeric',
  'photo',
  'dropdown'
);

CREATE TYPE public.inspection_status AS ENUM (
  'draft',
  'completed'
);

-- ============================================================
-- inspection_templates
-- ============================================================

CREATE TABLE public.inspection_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  sections JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inspection_templates_org ON public.inspection_templates (organization_id);
CREATE INDEX idx_inspection_templates_created_by ON public.inspection_templates (created_by);
CREATE INDEX idx_inspection_templates_active ON public.inspection_templates (is_active);

CREATE TRIGGER on_inspection_templates_updated
  BEFORE UPDATE ON public.inspection_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- inspections
-- ============================================================

CREATE SEQUENCE public.inspection_ref_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_inspection_reference()
RETURNS TEXT AS $$
BEGIN
  RETURN 'INS-' || EXTRACT(YEAR FROM now())::TEXT || '-' || LPAD(nextval('public.inspection_ref_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE TABLE public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT NOT NULL UNIQUE DEFAULT public.generate_inspection_reference(),
  template_id UUID NOT NULL REFERENCES public.inspection_templates(id),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  conducted_by UUID NOT NULL REFERENCES public.profiles(id),
  status public.inspection_status NOT NULL DEFAULT 'draft',
  score NUMERIC(5,2),
  total_items INTEGER NOT NULL DEFAULT 0,
  scorable_items INTEGER NOT NULL DEFAULT 0,
  compliant_items INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inspections_template ON public.inspections (template_id);
CREATE INDEX idx_inspections_project ON public.inspections (project_id);
CREATE INDEX idx_inspections_org ON public.inspections (organization_id);
CREATE INDEX idx_inspections_conducted_by ON public.inspections (conducted_by);
CREATE INDEX idx_inspections_status ON public.inspections (status);
CREATE INDEX idx_inspections_reference ON public.inspections (reference_number);

CREATE TRIGGER on_inspections_updated
  BEFORE UPDATE ON public.inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- inspection_responses
-- ============================================================

CREATE TABLE public.inspection_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  field_type public.inspection_field_type NOT NULL,
  value TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inspection_responses_inspection ON public.inspection_responses (inspection_id);
CREATE INDEX idx_inspection_responses_item ON public.inspection_responses (item_id);

-- ============================================================
-- RLS: inspection_templates
-- ============================================================
ALTER TABLE public.inspection_templates ENABLE ROW LEVEL SECURITY;

-- System admins see all
CREATE POLICY "inspection_templates_select_admin" ON public.inspection_templates
  FOR SELECT USING (public.auth_is_admin());

-- Client org members see their org's templates
CREATE POLICY "inspection_templates_select_client" ON public.inspection_templates
  FOR SELECT USING (
    public.auth_user_org_type() = 'client'
    AND organization_id = public.auth_user_org_id()
  );

-- Contractors see templates from client orgs they work with
CREATE POLICY "inspection_templates_select_contractor" ON public.inspection_templates
  FOR SELECT USING (
    public.auth_user_org_type() = 'contractor'
    AND organization_id IN (
      SELECT p.client_org_id FROM public.projects p
      INNER JOIN public.project_contractors pc ON pc.project_id = p.id
      WHERE pc.contractor_org_id = public.auth_user_org_id()
    )
  );

-- Client admin/manager can create templates
CREATE POLICY "inspection_templates_insert" ON public.inspection_templates
  FOR INSERT WITH CHECK (
    public.auth_is_admin()
    OR (
      public.auth_user_role() IN ('client_admin', 'client_manager')
      AND organization_id = public.auth_user_org_id()
    )
  );

-- Client admin/manager can update their org's templates
CREATE POLICY "inspection_templates_update" ON public.inspection_templates
  FOR UPDATE USING (
    public.auth_is_admin()
    OR (
      public.auth_user_role() IN ('client_admin', 'client_manager')
      AND organization_id = public.auth_user_org_id()
    )
  );

-- ============================================================
-- RLS: inspections
-- ============================================================
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

-- System admins see all
CREATE POLICY "inspections_select_admin" ON public.inspections
  FOR SELECT USING (public.auth_is_admin());

-- Client org sees inspections on their projects
CREATE POLICY "inspections_select_client" ON public.inspections
  FOR SELECT USING (
    public.auth_user_org_type() = 'client'
    AND project_id IN (
      SELECT id FROM public.projects WHERE client_org_id = public.auth_user_org_id()
    )
  );

-- Contractors see only their own conducted inspections
CREATE POLICY "inspections_select_contractor" ON public.inspections
  FOR SELECT USING (
    public.auth_user_org_type() = 'contractor'
    AND conducted_by = public.auth_user_id()
  );

-- Authenticated users can create inspections on projects they can see
CREATE POLICY "inspections_insert" ON public.inspections
  FOR INSERT WITH CHECK (
    conducted_by = public.auth_user_id()
    AND (
      public.auth_is_admin()
      OR project_id IN (
        SELECT id FROM public.projects WHERE client_org_id = public.auth_user_org_id()
      )
      OR project_id IN (
        SELECT project_id FROM public.project_contractors
        WHERE contractor_org_id = public.auth_user_org_id()
      )
    )
  );

-- Users can update their own draft inspections
CREATE POLICY "inspections_update" ON public.inspections
  FOR UPDATE USING (
    conducted_by = public.auth_user_id()
    OR public.auth_is_admin()
  );

-- ============================================================
-- RLS: inspection_responses
-- ============================================================
ALTER TABLE public.inspection_responses ENABLE ROW LEVEL SECURITY;

-- Admins see all
CREATE POLICY "inspection_responses_select_admin" ON public.inspection_responses
  FOR SELECT USING (public.auth_is_admin());

-- Client sees responses on their project inspections
CREATE POLICY "inspection_responses_select_client" ON public.inspection_responses
  FOR SELECT USING (
    public.auth_user_org_type() = 'client'
    AND inspection_id IN (
      SELECT i.id FROM public.inspections i
      INNER JOIN public.projects p ON i.project_id = p.id
      WHERE p.client_org_id = public.auth_user_org_id()
    )
  );

-- Contractors see responses on their own inspections
CREATE POLICY "inspection_responses_select_contractor" ON public.inspection_responses
  FOR SELECT USING (
    public.auth_user_org_type() = 'contractor'
    AND inspection_id IN (
      SELECT id FROM public.inspections WHERE conducted_by = public.auth_user_id()
    )
  );

-- Users can insert responses on inspections they conducted
CREATE POLICY "inspection_responses_insert" ON public.inspection_responses
  FOR INSERT WITH CHECK (
    inspection_id IN (
      SELECT id FROM public.inspections WHERE conducted_by = public.auth_user_id()
    )
    OR public.auth_is_admin()
  );

-- ============================================================
-- Storage bucket for inspection photos
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-photos', 'inspection-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "inspection_photos_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'inspection-photos'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "inspection_photos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'inspection-photos');
