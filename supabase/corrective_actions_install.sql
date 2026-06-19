-- ============================================================
-- Corrective Actions install bundle
-- Paste this whole file into the Supabase SQL Editor and run it.
-- Combines:
--   010_corrective_actions.sql  (enums, sequence, generator, table, indexes,
--                                trigger + events.was_security / events.impact_other)
--   011_corrective_actions_rls.sql (RLS enable + policies)
-- ============================================================

-- === 010_corrective_actions.sql ===

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

-- === 011_corrective_actions_rls.sql ===

ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;

-- SELECT: admin OR creator org OR responsible person OR chosen approver
CREATE POLICY "corrective_actions_select" ON public.corrective_actions
  FOR SELECT USING (
    public.auth_is_admin()
    OR creator_org_id = public.auth_user_org_id()
    OR assigned_to = auth.uid()
    OR approver_id = auth.uid()
  );

-- INSERT: creator = self AND creator org = own org (or admin)
CREATE POLICY "corrective_actions_insert" ON public.corrective_actions
  FOR INSERT WITH CHECK (
    public.auth_is_admin()
    OR (
      created_by = auth.uid()
      AND creator_org_id = public.auth_user_org_id()
    )
  );

-- UPDATE: admin OR creator OR responsible person OR chosen approver
CREATE POLICY "corrective_actions_update" ON public.corrective_actions
  FOR UPDATE USING (
    public.auth_is_admin()
    OR created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR approver_id = auth.uid()
  );
