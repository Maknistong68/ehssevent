-- Migration 014: Event response thread (migrated from observation_responses)
-- Mirrors the observation_responses structure with an event_id FK + RLS.

CREATE TABLE public.event_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  responded_by UUID NOT NULL REFERENCES public.profiles(id),
  responder_org_id UUID NOT NULL REFERENCES public.organizations(id),
  response_text TEXT NOT NULL,
  photo_urls TEXT[] DEFAULT '{}',
  is_closing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_responses_event ON public.event_responses (event_id);
CREATE INDEX idx_event_responses_responded_by ON public.event_responses (responded_by);
CREATE INDEX idx_event_responses_responder_org ON public.event_responses (responder_org_id);

-- ============================================================
-- RLS: event_responses (visibility mirrors the parent event)
-- ============================================================
ALTER TABLE public.event_responses ENABLE ROW LEVEL SECURITY;

-- Admins see all
CREATE POLICY "event_responses_select_admin" ON public.event_responses
  FOR SELECT USING (public.auth_is_admin());

-- Client sees responses on events they can see (org-created or on their projects)
CREATE POLICY "event_responses_select_client" ON public.event_responses
  FOR SELECT USING (
    public.auth_user_org_type() = 'client'
    AND event_id IN (
      SELECT e.id FROM public.events e
      WHERE e.creator_org_id = public.auth_user_org_id()
        OR e.project_id IN (
          SELECT id FROM public.projects WHERE client_org_id = public.auth_user_org_id()
        )
    )
  );

-- Contractor sees responses on events their org created
CREATE POLICY "event_responses_select_contractor" ON public.event_responses
  FOR SELECT USING (
    public.auth_user_org_type() = 'contractor'
    AND event_id IN (
      SELECT id FROM public.events WHERE creator_org_id = public.auth_user_org_id()
    )
  );

-- Anyone who can see the event can add a response (as themselves)
CREATE POLICY "event_responses_insert" ON public.event_responses
  FOR INSERT WITH CHECK (
    responded_by = auth.uid()
    AND (
      public.auth_is_admin()
      OR event_id IN (
        SELECT e.id FROM public.events e
        WHERE e.creator_org_id = public.auth_user_org_id()
          OR e.project_id IN (
            SELECT id FROM public.projects WHERE client_org_id = public.auth_user_org_id()
          )
      )
    )
  );
