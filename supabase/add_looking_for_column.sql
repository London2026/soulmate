-- Add relationship-intent field ("Looking For") to profiles
-- Values: Dating | Marriage | Life Partner | Soulful Connection | Long-term Partnership
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS looking_for text;
