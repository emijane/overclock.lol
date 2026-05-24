-- Harden block-helper read RPCs so unauthorized callers fail closed instead of
-- receiving "safe" false/empty responses that can hide misuse in app code.
--
-- These helpers are still used by stack, profile, search, and feed RPCs, but
-- those call sites already derive viewer identity from auth.uid() before
-- invoking the helpers.

create or replace function public.is_profile_blocked_by(
  p_blocker_profile_id uuid,
  p_blocked_profile_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'forbidden'
      using errcode = '42501';
  end if;

  if p_blocker_profile_id is distinct from auth.uid()
     and p_blocked_profile_id is distinct from auth.uid() then
    raise exception 'forbidden'
      using errcode = '42501';
  end if;

  return exists (
    select 1
    from public.user_blocks
    where blocker_profile_id = p_blocker_profile_id
      and blocked_profile_id = p_blocked_profile_id
  );
end;
$$;

create or replace function public.has_either_user_blocked(
  p_profile_a uuid,
  p_profile_b uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'forbidden'
      using errcode = '42501';
  end if;

  if p_profile_a is distinct from auth.uid()
     and p_profile_b is distinct from auth.uid() then
    raise exception 'forbidden'
      using errcode = '42501';
  end if;

  return exists (
    select 1
    from public.user_blocks
    where (blocker_profile_id = p_profile_a and blocked_profile_id = p_profile_b)
       or (blocker_profile_id = p_profile_b and blocked_profile_id = p_profile_a)
  );
end;
$$;

create or replace function public.are_profiles_blocked(
  p_profile_a uuid,
  p_profile_b uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return public.has_either_user_blocked(p_profile_a, p_profile_b);
end;
$$;

create or replace function public.get_blocked_profile_ids_for_viewer(
  p_viewer_profile_id uuid
)
returns uuid[]
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or p_viewer_profile_id is distinct from auth.uid() then
    raise exception 'forbidden'
      using errcode = '42501';
  end if;

  return coalesce(
    (
      select array_agg(distinct blocked_profile_id)
      from (
        select ub.blocked_profile_id
        from public.user_blocks ub
        where ub.blocker_profile_id = p_viewer_profile_id

        union

        select ub.blocker_profile_id as blocked_profile_id
        from public.user_blocks ub
        where ub.blocked_profile_id = p_viewer_profile_id
      ) blocked_pairs
    ),
    array[]::uuid[]
  );
end;
$$;

revoke all on function public.is_profile_blocked_by(uuid, uuid) from public;
revoke all on function public.has_either_user_blocked(uuid, uuid) from public;
revoke all on function public.are_profiles_blocked(uuid, uuid) from public;
revoke all on function public.get_blocked_profile_ids_for_viewer(uuid) from public;

grant execute on function public.is_profile_blocked_by(uuid, uuid) to authenticated;
grant execute on function public.has_either_user_blocked(uuid, uuid) to authenticated;
grant execute on function public.are_profiles_blocked(uuid, uuid) to authenticated;
grant execute on function public.get_blocked_profile_ids_for_viewer(uuid) to authenticated;
