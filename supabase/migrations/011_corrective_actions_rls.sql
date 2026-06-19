-- Migration 011: Corrective Actions RLS
-- Reuses the existing event-photos storage bucket for CA photos.

ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SELECT
-- admin OR creator org OR responsible person OR chosen approver
-- ============================================================
CREATE POLICY "corrective_actions_select" ON public.corrective_actions
  FOR SELECT USING (
    public.auth_is_admin()
    OR creator_org_id = public.auth_user_org_id()
    OR assigned_to = auth.uid()
    OR approver_id = auth.uid()
  );

-- ============================================================
-- INSERT
-- creator = self AND creator org = own org (or admin)
-- ============================================================
CREATE POLICY "corrective_actions_insert" ON public.corrective_actions
  FOR INSERT WITH CHECK (
    public.auth_is_admin()
    OR (
      created_by = auth.uid()
      AND creator_org_id = public.auth_user_org_id()
    )
  );

-- ============================================================
-- UPDATE
-- admin OR creator OR responsible person OR chosen approver
-- ============================================================
CREATE POLICY "corrective_actions_update" ON public.corrective_actions
  FOR UPDATE USING (
    public.auth_is_admin()
    OR created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR approver_id = auth.uid()
  );
