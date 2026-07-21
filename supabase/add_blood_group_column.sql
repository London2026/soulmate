-- Add blood group field to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blood_group text;
