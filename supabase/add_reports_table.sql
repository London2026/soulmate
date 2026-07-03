-- Profile reports table
-- Run in Supabase SQL Editor → New Query

CREATE TABLE IF NOT EXISTS public.reports (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reported_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason      text NOT NULL,
  message     text,
  status      text DEFAULT 'pending',
  created_at  timestamptz DEFAULT now(),
  UNIQUE(reporter_id, reported_id)
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);
