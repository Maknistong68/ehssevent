-- Migration 013: Link corrective actions to a specific inspection item
-- Adds nullable inspection linkage alongside the existing event linkage.

ALTER TABLE public.corrective_actions
  ADD COLUMN IF NOT EXISTS inspection_id UUID REFERENCES public.inspections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS section_id TEXT,
  ADD COLUMN IF NOT EXISTS item_id TEXT,
  ADD COLUMN IF NOT EXISTS item_label TEXT;

CREATE INDEX IF NOT EXISTS idx_corrective_actions_inspection_id
  ON public.corrective_actions (inspection_id);
