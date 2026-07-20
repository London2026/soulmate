-- Add sexual orientation field to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sexual_orientation text;
