-- Tracks every email that has ever used the Free Trial plan, independent of
-- profiles/auth.users so it survives account deletion. Prevents someone from
-- deleting their account and signing back up with the same email to reset
-- their 30-day free trial — they can still create a new account with that
-- email, but it can't be set to the free plan again.
CREATE TABLE IF NOT EXISTS public.used_free_trial_emails (
  email text PRIMARY KEY,
  first_used_at timestamptz DEFAULT now()
);

ALTER TABLE public.used_free_trial_emails ENABLE ROW LEVEL SECURITY;
-- No policies — only the service-role client (which bypasses RLS) reads or
-- writes this table, from selectPlan()'s server action.
