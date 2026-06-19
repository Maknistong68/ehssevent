-- Migration 005: Observations + observation_responses

-- Sequence for auto-incrementing reference numbers
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

-- Indexes for RLS and queries
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
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Observation responses (timeline)
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
