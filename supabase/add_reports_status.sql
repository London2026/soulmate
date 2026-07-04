ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended boolean DEFAULT false;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
