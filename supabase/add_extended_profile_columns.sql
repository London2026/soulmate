-- Add extended profile columns for full profile card and partner preferences
-- Run in Supabase SQL Editor → New Query

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sub_religion          text,
  ADD COLUMN IF NOT EXISTS zodiac_sign           text,
  ADD COLUMN IF NOT EXISTS university            text,
  ADD COLUMN IF NOT EXISTS other_qualifications  text,
  ADD COLUMN IF NOT EXISTS housing               text,
  ADD COLUMN IF NOT EXISTS voice_native_path     text,
  ADD COLUMN IF NOT EXISTS pref_sub_religion     text,
  ADD COLUMN IF NOT EXISTS pref_occupation       text,
  ADD COLUMN IF NOT EXISTS pref_height           text,
  ADD COLUMN IF NOT EXISTS pref_ethnicity        text;
