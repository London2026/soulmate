-- Add ID verification fields used by onboarding + admin review
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS id_country        text,
  ADD COLUMN IF NOT EXISTS id_document_path  text,
  ADD COLUMN IF NOT EXISTS id_verified       boolean DEFAULT false;

-- Prevent members from setting their own id_verified flag via the
-- profiles_update RLS policy — only the admin (service role) may flip it.
CREATE OR REPLACE FUNCTION public.protect_id_verified()
RETURNS trigger AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NEW.id_verified IS DISTINCT FROM OLD.id_verified THEN
    NEW.id_verified := OLD.id_verified;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_id_verified_trigger ON public.profiles;
CREATE TRIGGER protect_id_verified_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_id_verified();
