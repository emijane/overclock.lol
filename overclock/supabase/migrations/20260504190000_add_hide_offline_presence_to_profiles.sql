alter table public.profiles
add column if not exists hide_offline_presence boolean not null default false;
