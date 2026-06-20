-- Migration 020: Audit log
--
-- Records privileged actions (role/org/status changes, impersonation start/stop)
-- for admin troubleshooting. Rows are written exclusively through the
-- SECURITY DEFINER function public.write_audit_log so that guarded server
-- actions can insert while normal clients cannot. Reads are admin-only.

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email  TEXT,
  action       TEXT NOT NULL,
  target_table TEXT,
  target_id    UUID,
  target_label TEXT,
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx
  ON public.audit_logs (created_at DESC);

-- ============================================================
-- RLS: admins may read; nobody may insert/update/delete directly
-- (writes only via the SECURITY DEFINER function below).
-- ============================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
  FOR SELECT USING (public.auth_is_admin());

-- ============================================================
-- Writer function — derives the actor from the authenticated session so the
-- recorded actor cannot be spoofed by the caller.
-- ============================================================
CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_action       TEXT,
  p_target_table TEXT  DEFAULT NULL,
  p_target_id    UUID  DEFAULT NULL,
  p_target_label TEXT  DEFAULT NULL,
  p_metadata     JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_actor_id    UUID := auth.uid();
  v_actor_email TEXT;
  v_id          UUID;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_actor_email FROM public.profiles WHERE id = v_actor_id;

  INSERT INTO public.audit_logs (
    actor_id, actor_email, action, target_table, target_id, target_label, metadata
  )
  VALUES (
    v_actor_id, v_actor_email, p_action, p_target_table, p_target_id, p_target_label,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
