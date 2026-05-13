create or replace function public.expire_all_play_invites()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_expired_count integer := 0;
begin
  update public.play_invites
  set
    status = 'expired',
    updated_at = now()
  where status = 'pending'
    and expires_at <= now();

  get diagnostics v_expired_count = row_count;

  return jsonb_build_object(
    'expired_count', v_expired_count,
    'error_code', null
  );
end;
$$;

revoke all on function public.expire_all_play_invites() from public;
grant execute on function public.expire_all_play_invites() to service_role;

create or replace function public.cleanup_user_block_events(
  p_before timestamptz default (now() - interval '30 days')
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted_count integer := 0;
begin
  delete from public.user_block_events
  where created_at < p_before;

  get diagnostics v_deleted_count = row_count;

  return jsonb_build_object(
    'deleted_count', v_deleted_count,
    'error_code', null
  );
end;
$$;

revoke all on function public.cleanup_user_block_events(timestamptz) from public;
grant execute on function public.cleanup_user_block_events(timestamptz) to service_role;

create or replace function public.cleanup_profile_media_uploads(
  p_before timestamptz default (now() - interval '30 days')
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted_count integer := 0;
begin
  delete from public.profile_media_uploads
  where uploaded_at < p_before;

  get diagnostics v_deleted_count = row_count;

  return jsonb_build_object(
    'deleted_count', v_deleted_count,
    'error_code', null
  );
end;
$$;

revoke all on function public.cleanup_profile_media_uploads(timestamptz) from public;
grant execute on function public.cleanup_profile_media_uploads(timestamptz) to service_role;
