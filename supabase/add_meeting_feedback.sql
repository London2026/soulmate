-- Meeting feedback (1–5 stars + note, submitted by each participant after a meeting)
CREATE TABLE IF NOT EXISTS public.meeting_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  note text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(meeting_id, reviewer_id)
);

ALTER TABLE public.meeting_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback" ON public.meeting_feedback
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can select own feedback" ON public.meeting_feedback
  FOR SELECT USING (auth.uid() = reviewer_id);

-- Prevents duplicate cron emails for the same meeting
ALTER TABLE public.video_meetings
  ADD COLUMN IF NOT EXISTS feedback_requested boolean DEFAULT false;

-- Tracks when a paid plan started (used for approximate renewal date display)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_started_at timestamptz;
