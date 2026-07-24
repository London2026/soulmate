-- Tracks Pixxles COPYandPAY checkout sessions and their final status.
-- One row is created when a checkout is prepared (status='pending'), then
-- updated to 'success'/'failed' once the result page or webhook verifies it
-- against Pixxles directly (Pixxles is always the source of truth — this
-- table is a local cache/audit trail, not the authority on payment status).
CREATE TABLE IF NOT EXISTS public.pixxles_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'GBP',
  status text NOT NULL DEFAULT 'pending', -- pending | success | failed
  result_code text,
  transaction_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.pixxles_payments ENABLE ROW LEVEL SECURITY;

-- All writes happen server-side via the service-role client (checkout
-- creation, result verification, webhook). Members may only read their own
-- payment history.
CREATE POLICY "pixxles_payments_select_own" ON public.pixxles_payments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
