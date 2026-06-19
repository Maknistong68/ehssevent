-- 016: PDPL Consent Tracking
-- Adds consent tracking columns to profiles for Saudi PDPL compliance

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT,
  ADD COLUMN IF NOT EXISTS privacy_version TEXT;

-- Update handle_new_user trigger to capture consent timestamps from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, terms_accepted_at, privacy_accepted_at, terms_version, privacy_version)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    'contractor_user',
    CASE WHEN NEW.raw_user_meta_data ->> 'terms_accepted' = 'true' THEN NOW() ELSE NULL END,
    CASE WHEN NEW.raw_user_meta_data ->> 'privacy_accepted' = 'true' THEN NOW() ELSE NULL END,
    CASE WHEN NEW.raw_user_meta_data ->> 'terms_accepted' = 'true' THEN '1.0' ELSE NULL END,
    CASE WHEN NEW.raw_user_meta_data ->> 'privacy_accepted' = 'true' THEN '1.0' ELSE NULL END
  );
  RETURN NEW;
END;
$$;
