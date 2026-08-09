-- Age verification: date of birth captured at signup, before any account/profile is created.
alter table profiles add column if not exists date_of_birth date;
