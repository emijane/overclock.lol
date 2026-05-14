create or replace function public.update_last_seen()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_updated_count integer := 0;
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'updated', false,
      'error_code', 'unauthenticated'
    );
  end if;

  update public.profiles
  set last_seen_at = now()
  where id = auth.uid();

  get diagnostics v_updated_count = row_count;

  if v_updated_count = 0 then
    return jsonb_build_object(
      'updated', false,
      'error_code', 'profile_not_found'
    );
  end if;

  return jsonb_build_object(
    'updated', true,
    'error_code', null
  );
end;
$$;

revoke all on function public.update_last_seen() from public;
grant execute on function public.update_last_seen() to anon, authenticated;
