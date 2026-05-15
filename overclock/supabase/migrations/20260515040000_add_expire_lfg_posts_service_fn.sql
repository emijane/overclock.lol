-- Phase 2D: Expose a service-safe expiration function for scheduled execution.
-- Requires: 20260515020000_add_lfg_post_expiration_writes.sql
--           20260515030000_switch_lfg_feed_to_expires_at.sql
--
-- What changes:
--   expire_lfg_posts()   — new security-definer function containing all expiration
--                          logic; granted to service_role only (not anon/authenticated)
--   expire_stack_posts() — replaced with a thin wrapper that calls expire_lfg_posts();
--                          retains anon/authenticated grant so internal security-definer
--                          RPCs (close_owned_lfg_post, send_stack_request, etc.) continue
--                          to work without modification
--
-- Caller model:
--   Scheduled job  → calls public.expire_lfg_posts() via service_role
--   Internal RPCs  → call expire_stack_posts() as before (security definer context
--                    means the function owner invokes expire_lfg_posts() transparently)
--   anon/auth user → cannot call expire_lfg_posts() directly; expire_stack_posts()
--                    is callable but only delegates — no direct user data is modified
--                    beyond what the system already intends
--
-- Idempotency: coalesce guards on expired_at and purge_after mean repeated calls
-- produce no additional changes. Status update only affects 'active'/'filled' rows.
--
-- Named policy values used here:
--   LFG_RETENTION_DAYS = 30

-- ─── 1. expire_lfg_posts ──────────────────────────────────────────────────────
-- Canonical expiration entry point for scheduled / service_role execution.
-- Expires all post types whose expires_at has passed.
-- Stack member and request cleanup runs only for stacks posts.

create or replace function public.expire_lfg_posts()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_all_expired_ids   uuid[];
  v_stack_expired_ids uuid[];
  v_count             integer := 0;
begin
  select
    coalesce(array_agg(id),                                     array[]::uuid[]),
    coalesce(array_agg(id) filter (where lfg_type = 'stacks'), array[]::uuid[])
  into v_all_expired_ids, v_stack_expired_ids
  from public.lfg_posts
  where status in ('active', 'filled')
    and expires_at is not null
    and expires_at <= now();

  v_count := coalesce(array_length(v_all_expired_ids, 1), 0);

  if v_count = 0 then
    return jsonb_build_object('updated', true, 'expired_count', 0);
  end if;

  update public.lfg_posts
  set
    status      = 'expired',
    expired_at  = coalesce(expired_at,  now()),
    purge_after = coalesce(purge_after, now() + interval '30 days')
  where id = any(v_all_expired_ids);

  if coalesce(array_length(v_stack_expired_ids, 1), 0) > 0 then
    update public.stack_requests
    set
      status       = 'declined',
      updated_at   = now(),
      responded_at = coalesce(responded_at, now()),
      declined_at  = coalesce(declined_at,  now())
    where post_id = any(v_stack_expired_ids)
      and status  = 'pending';

    update public.stack_members
    set
      removed_at            = now(),
      removed_by_profile_id = coalesce(removed_by_profile_id, profile_id)
    where post_id    = any(v_stack_expired_ids)
      and removed_at is null;
  end if;

  return jsonb_build_object('updated', true, 'expired_count', v_count);
end;
$$;

revoke all     on function public.expire_lfg_posts() from public;
revoke execute on function public.expire_lfg_posts() from anon, authenticated;
grant  execute on function public.expire_lfg_posts() to service_role;

-- ─── 2. expire_stack_posts ────────────────────────────────────────────────────
-- Thin wrapper: delegates to expire_lfg_posts().
-- Exists only for backward compatibility with internal security-definer RPCs
-- (close_owned_lfg_post, send_stack_request, accept_stack_request, leave_stack,
-- remove_stack_member) that call this function by name.
-- Because expire_stack_posts() is security definer it runs as the function owner,
-- which can invoke expire_lfg_posts() regardless of the anon/authenticated revoke.

create or replace function public.expire_stack_posts()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return public.expire_lfg_posts();
end;
$$;

revoke all on function public.expire_stack_posts() from public;
grant execute on function public.expire_stack_posts() to anon, authenticated;
