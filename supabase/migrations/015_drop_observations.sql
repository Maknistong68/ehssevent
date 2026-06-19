-- Migration 015: Drop the Observation module (run LAST, after code no longer queries it)
-- Event Report is now the single reporting module; the response thread lives on events.

DROP TABLE IF EXISTS public.observation_responses CASCADE;
DROP TABLE IF EXISTS public.observations CASCADE;

DROP FUNCTION IF EXISTS public.generate_observation_reference() CASCADE;
DROP SEQUENCE IF EXISTS public.observation_ref_seq CASCADE;

DROP TYPE IF EXISTS public.observation_status CASCADE;
DROP TYPE IF EXISTS public.observation_priority CASCADE;
DROP TYPE IF EXISTS public.observation_category CASCADE;
