-- Shortlist / favourites table
-- Run in Supabase SQL Editor → New Query

CREATE TABLE IF NOT EXISTS public.shortlist (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, profile_id)
);

ALTER TABLE public.shortlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own shortlist"
  ON public.shortlist FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
