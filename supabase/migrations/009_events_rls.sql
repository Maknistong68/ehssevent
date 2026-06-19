-- Migration 009: Events RLS + storage bucket

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- System admins see all
CREATE POLICY "events_select_admin" ON public.events
  FOR SELECT USING (public.auth_is_admin());

-- Client org sees all events on their projects, plus events their org created
CREATE POLICY "events_select_client" ON public.events
  FOR SELECT USING (
    public.auth_user_org_type() = 'client'
    AND (
      creator_org_id = public.auth_user_org_id()
      OR project_id IN (
        SELECT id FROM public.projects WHERE client_org_id = public.auth_user_org_id()
      )
    )
  );

-- Contractor org sees events their own org created
CREATE POLICY "events_select_contractor" ON public.events
  FOR SELECT USING (
    public.auth_user_org_type() = 'contractor'
    AND creator_org_id = public.auth_user_org_id()
  );

-- Any authenticated org member can create events for their own org
CREATE POLICY "events_insert" ON public.events
  FOR INSERT WITH CHECK (
    public.auth_is_admin()
    OR (
      created_by = auth.uid()
      AND creator_org_id = public.auth_user_org_id()
    )
  );

-- Admins can update anything
CREATE POLICY "events_update_admin" ON public.events
  FOR UPDATE USING (public.auth_is_admin());

-- Client org can update events on their projects or created by their org
CREATE POLICY "events_update_client" ON public.events
  FOR UPDATE USING (
    public.auth_user_org_type() = 'client'
    AND (
      creator_org_id = public.auth_user_org_id()
      OR project_id IN (
        SELECT id FROM public.projects WHERE client_org_id = public.auth_user_org_id()
      )
    )
  );

-- Contractor org can update events their org created
CREATE POLICY "events_update_contractor" ON public.events
  FOR UPDATE USING (
    public.auth_user_org_type() = 'contractor'
    AND creator_org_id = public.auth_user_org_id()
  );

-- ============================================================
-- Storage bucket for event photos
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "event_photos_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-photos'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "event_photos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-photos');
