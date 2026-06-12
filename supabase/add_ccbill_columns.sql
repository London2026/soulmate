-- Run in Supabase SQL Editor
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ccbill_subscription_id text;

CREATE INDEX IF NOT EXISTS profiles_ccbill_subscription_id_idx
  ON public.profiles(ccbill_subscription_id);
