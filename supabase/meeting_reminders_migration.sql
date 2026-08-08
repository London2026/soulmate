-- Adds an absolute timestamp for each meeting plus reminder-sent flags,
-- so reminder timing is exact regardless of either member's country.
alter table video_meetings
  add column if not exists meeting_at timestamptz,
  add column if not exists reminder_60_sent boolean not null default false,
  add column if not exists reminder_15_sent boolean not null default false;

create index if not exists video_meetings_reminder_idx
  on video_meetings (status, meeting_at)
  where status = 'accepted';
