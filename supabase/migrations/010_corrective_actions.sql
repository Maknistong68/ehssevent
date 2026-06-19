-- Migration 010: Corrective Actions tracker
-- Also extends events with was_security / impact_other columns.

-- ============================================================
-- Extend events table (dynamic form additions)
-- ============================================================
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS was_security BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS impact_other TEXT;

-- ============================================================
-- Enums
-- ============================================================
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

-- ============================================================
-- Reference number sequence + generator (CA-YYYY-NNNNNN)
-- ============================================================
CREATE SEQUENCE public.corrective_action_ref_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_corrective_action_reference()
RETURNS TEXT AS $$
BEGIN
  RETURN 'CA-' || EXTRACT(YEAR FROM now())::TEXT || '-' || LPAD(nextval('public.corrective_action_ref_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Corrective actions table
-- ============================================================
CREATE TABLE public.corrective_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT NOT NULL UNIQUE DEFAULT public.generate_corrective_action_reference(),

  -- Linkage (nullable: supports event-linked AND standalone)
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id),

  -- Ownership / scoping
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  creator_org_id UUID NOT NULL REFERENCES public.organizations(id),

  -- Workflow people
  assigned_to UUID REFERENCES public.profiles(id),   -- responsible person
  approver_id UUID REFERENCES public.profiles(id),    -- chosen approver

  -- Core fields
  title TEXT NOT NULL,
  description TEXT,
  priority public.corrective_action_priority NOT NULL DEFAULT 'medium',
  status public.corrective_action_status NOT NULL DEFAULT 'open',
  due_date DATE,
  photo_urls TEXT[] DEFAULT '{}',

  -- Workflow timestamps / outcomes
  completed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
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
