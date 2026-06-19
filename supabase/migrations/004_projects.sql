-- Migration 004: Projects + project_contractors
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

-- Indexes
CREATE INDEX idx_projects_client_org_id ON public.projects (client_org_id);
CREATE INDEX idx_projects_is_active ON public.projects (is_active);

CREATE TRIGGER on_projects_updated
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Many-to-many: projects <-> contractor orgs
CREATE TABLE public.project_contractors (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  contractor_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, contractor_org_id)
);

CREATE INDEX idx_project_contractors_contractor ON public.project_contractors (contractor_org_id);
CREATE INDEX idx_project_contractors_project ON public.project_contractors (project_id);
