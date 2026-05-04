alter table public.competitive_profiles
add column if not exists platform text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'competitive_profiles_platform_check'
  ) then
    alter table public.competitive_profiles
    add constraint competitive_profiles_platform_check
    check (platform is null or platform in ('PC', 'Console'));
  end if;
end
$$;

insert into public.competitive_profiles (profile_id, platform)
select profiles.id, profiles.platform
from public.profiles
where profiles.platform is not null
on conflict (profile_id) do update
set platform = excluded.platform;
