-- Referral system
-- Run in Supabase SQL Editor → New Query

CREATE TABLE IF NOT EXISTS public.referrals (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view referrals they made"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_credits integer DEFAULT 0;
