-- Stores a permanently blurred, downscaled copy of the face photo,
-- generated server-side, so unrevealed viewers can see a genuine blurred
-- preview without ever receiving the real (revealable) photo.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS front_photo_blurred_path text;
