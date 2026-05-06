revoke insert, update, delete on table public.play_invites from anon, authenticated;
revoke select on table public.play_invites from anon;
grant select on table public.play_invites to authenticated;

drop policy if exists "play_invites_participant_read" on public.play_invites;
create policy "play_invites_participant_read"
on public.play_invites
for select
to authenticated
using (
  sender_profile_id = auth.uid()
  or recipient_profile_id = auth.uid()
);

create or replace function public.send_play_invite(
  p_message text,
  p_recipient_profile_id uuid,
  p_source_lfg_post_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_sender_profile record;
  v_source_post record;
  v_invite_id uuid;
  v_normalized_message text := nullif(regexp_replace(trim(coalesce(p_message, '')), '\s+', ' ', 'g'), '');
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'created', false,
      'error_code', 'unauthenticated',
      'invite_id', null
    );
  end if;

  if p_recipient_profile_id is null then
    return jsonb_build_object(
      'created', false,
      'error_code', 'invalid_recipient',
      'invite_id', null
    );
  end if;

  if auth.uid() = p_recipient_profile_id then
    return jsonb_build_object(
      'created', false,
      'error_code', 'self_invite',
      'invite_id', null
    );
  end if;

  if v_normalized_message is not null and char_length(v_normalized_message) > 280 then
    return jsonb_build_object(
      'created', false,
      'error_code', 'invalid_message',
      'invite_id', null
    );
  end if;

  select
    p.id,
    p.username,
    p.display_name,
    p.discord_avatar_url,
    p.region,
    p.current_rank_tier,
    p.current_rank_division,
    cp.main_role
  into v_sender_profile
  from public.profiles p
  left join public.competitive_profiles cp
    on cp.profile_id = p.id
  where p.id = auth.uid();

  if v_sender_profile.id is null then
    return jsonb_build_object(
      'created', false,
      'error_code', 'sender_not_found',
      'invite_id', null
    );
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = p_recipient_profile_id
  ) then
    return jsonb_build_object(
      'created', false,
      'error_code', 'recipient_not_found',
      'invite_id', null
    );
  end if;

  if p_source_lfg_post_id is not null then
    select id, profile_id, status, created_at
    into v_source_post
    from public.lfg_posts
    where id = p_source_lfg_post_id;

    if v_source_post.id is null
      or v_source_post.profile_id <> p_recipient_profile_id
      or v_source_post.status <> 'active'
      or v_source_post.created_at < now() - interval '12 hours' then
      return jsonb_build_object(
        'created', false,
        'error_code', 'invalid_source_post',
        'invite_id', null
      );
    end if;
  end if;

  if (
    select count(*)
    from public.play_invites
    where sender_profile_id = auth.uid()
      and created_at >= now() - interval '10 minutes'
  ) >= 20 then
    return jsonb_build_object(
      'created', false,
      'error_code', 'send_rate_limited',
      'invite_id', null
    );
  end if;

  if (
    select count(*)
    from public.play_invites
    where sender_profile_id = auth.uid()
      and recipient_profile_id = p_recipient_profile_id
      and created_at >= now() - interval '10 minutes'
  ) >= 5 then
    return jsonb_build_object(
      'created', false,
      'error_code', 'recipient_rate_limited',
      'invite_id', null
    );
  end if;

  perform pg_advisory_xact_lock(
    hashtext('play_invite_send'),
    hashtext(
      auth.uid()::text
      || ':'
      || p_recipient_profile_id::text
      || ':'
      || coalesce(p_source_lfg_post_id::text, 'no-post')
    )
  );

  if exists (
    select 1
    from public.play_invites
    where sender_profile_id = auth.uid()
      and recipient_profile_id = p_recipient_profile_id
      and (
        source_lfg_post_id = p_source_lfg_post_id
        or (
          source_lfg_post_id is null
          and p_source_lfg_post_id is null
        )
      )
      and status = 'pending'
  ) then
    return jsonb_build_object(
      'created', false,
      'error_code', 'duplicate_pending_invite',
      'invite_id', null
    );
  end if;

  insert into public.play_invites (
    sender_profile_id,
    recipient_profile_id,
    source_lfg_post_id,
    status,
    message,
    sender_snapshot,
    updated_at
  )
  values (
    auth.uid(),
    p_recipient_profile_id,
    p_source_lfg_post_id,
    'pending',
    v_normalized_message,
    jsonb_build_object(
      'avatar_url', v_sender_profile.discord_avatar_url,
      'display_name', v_sender_profile.display_name,
      'main_role', v_sender_profile.main_role,
      'rank_division', v_sender_profile.current_rank_division,
      'rank_tier', v_sender_profile.current_rank_tier,
      'region', v_sender_profile.region,
      'username', v_sender_profile.username
    ),
    now()
  )
  returning id into v_invite_id;

  return jsonb_build_object(
    'created', true,
    'error_code', null,
    'invite_id', v_invite_id
  );
end;
$$;

revoke all on function public.send_play_invite(text, uuid, uuid) from public;
grant execute on function public.send_play_invite(text, uuid, uuid) to authenticated;
