alter table public.profiles
add column if not exists last_seen_at timestamptz;

alter table public.profiles
add column if not exists is_looking_to_play boolean not null default false;
