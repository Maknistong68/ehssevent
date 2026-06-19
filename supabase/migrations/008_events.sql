-- Migration 008: Events (weekly walkthrough / safety event reporting)

-- ============================================================
-- Enums
-- ============================================================
CREATE TYPE public.event_approval_level AS ENUM (
  'draft',
  'contractor_review',
  'review',
  'contractor_investigation',
  'investigation',
  'validation',
  'approval',
  'closed'
);

CREATE TYPE public.event_type AS ENUM (
  'incident',
  'near_miss',
  'hazard_identification',
  'positive_observation',
  'leadership_event'
);

CREATE TYPE public.event_classification AS ENUM (
  'safety',
  'fire',
  'environment',
  'welfare',
  'unsafe_act',
  'unsafe_condition',
  'non_conformance',
  'positive_observation',
  'leadership_site_visit',
  'emergency_drill',
  'safety_meeting',
  'contractor_performance_review',
  'to_be_determined'
);

CREATE TYPE public.event_significant_hazard AS ENUM (
  'mobile_plant_equipment',
  'driving',
  'working_near_live_roads',
  'breaking_ground_excavations',
  'work_at_height',
  'lifting',
  'confined_spaces',
  'fire',
  'hot_works',
  'energised_systems',
  'temporary_works',
  'drilling_blasting',
  'working_near_water',
  'working_in_heat',
  'other'
);

CREATE TYPE public.event_impacted_party AS ENUM (
  'client',
  'contractor',
  'visitor'
);

-- ============================================================
-- Reference number sequence + generator
-- ============================================================
CREATE SEQUENCE public.event_ref_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_event_reference()
RETURNS TEXT AS $$
BEGIN
  RETURN 'EVT-' || EXTRACT(YEAR FROM now())::TEXT || '-' || LPAD(nextval('public.event_ref_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Events table (mirrors the importable file structure)
-- ============================================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT NOT NULL UNIQUE DEFAULT public.generate_event_reference(),

  -- Ownership / scoping
  project_id UUID REFERENCES public.projects(id),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  creator_org_id UUID NOT NULL REFERENCES public.organizations(id),

  -- Core importable-file columns
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

  -- Workflow people (free text names)
  contractor_reviewer TEXT,
  reviewer TEXT,
  contractor_investigator TEXT,
  lead_investigator TEXT,
  validator TEXT,
  approver TEXT,
  created_by_name TEXT,

  -- Contractor closeout block
  closeout_photo_urls TEXT[] DEFAULT '{}',
  date_closure TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
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
