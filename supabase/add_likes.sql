-- Profile likes table for mutual like system
CREATE TABLE IF NOT EXISTS public.profile_likes (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  liker_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(liker_id, liked_id)
);

ALTER TABLE public.profile_likes ENABLE ROW LEVEL SECURITY;

-- Users can manage their own likes (insert, delete, select where they are the liker)
CREATE POLICY "Users can manage own likes"
  ON public.profile_likes FOR ALL
  USING (auth.uid() = liker_id)
  WITH CHECK (auth.uid() = liker_id);

-- Users can see likes where they are the liked profile (for mutual like detection)
CREATE POLICY "Users can see likes they received"
  ON public.profile_likes FOR SELECT
  USING (auth.uid() = liked_id);
