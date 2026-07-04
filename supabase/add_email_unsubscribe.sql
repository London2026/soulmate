ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_unsubscribed boolean DEFAULT false;
