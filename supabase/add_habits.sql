-- Add lifestyle & habits columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS habit_smoking  text,
  ADD COLUMN IF NOT EXISTS habit_drinking text,
  ADD COLUMN IF NOT EXISTS habit_drugs    text,
  ADD COLUMN IF NOT EXISTS habit_betting  text;
