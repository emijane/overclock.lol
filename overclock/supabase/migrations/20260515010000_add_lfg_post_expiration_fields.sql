-- Phase 2A: Add expiration timestamp fields to lfg_posts.
--
-- No behavior change in this migration.
-- Feed queries, RLS policies, and RPC logic are untouched.
-- These columns will be used in later phases to drive feed filtering,
-- expiration marking, and safe cleanup.
--
-- Constants baked into backfill SQL:
--   LFG_POST_EXPIRY_HOURS    = 24   (new policy, applies to active/filled/closed/archived)
--   LFG_ORIGINAL_EXPIRY_HOURS = 12  (original window, used only for already-expired rows)
--   LFG_RETENTION_DAYS       = 30   (how long inactive posts are retained before purge)

alter table public.lfg_posts
  add column if not exists expires_at  timestamptz,
  add column if not exists expired_at  timestamptz,
  add column if not exists closed_at   timestamptz,
  add column if not exists purge_after timestamptz;

-- Backfill active and filled posts.
-- expires_at is the point at which the post should leave the feed.
-- purge_after is 30 days after expiry.
update public.lfg_posts
set
  expires_at  = created_at + interval '24 hours',
  purge_after = created_at + interval '24 hours' + interval '30 days'
where status in ('active', 'filled')
  and expires_at is null;

-- Backfill already-expired posts.
-- These were expired under the original 12-hour window, so expires_at
-- is set to created_at + 12h as the best available approximation.
-- expired_at receives the same value since we have no recorded timestamp.
-- purge_after starts 30 days from that approximated expiry.
update public.lfg_posts
set
  expires_at  = created_at + interval '12 hours',
  expired_at  = created_at + interval '12 hours',
  purge_after = created_at + interval '12 hours' + interval '30 days'
where status = 'expired'
  and expires_at is null;

-- Backfill closed and archived posts.
-- expires_at reflects when they would have expired under the 24-hour policy.
-- closed_at is left null: no updated_at exists to approximate from.
-- purge_after starts 30 days from now since these posts are already inactive.
update public.lfg_posts
set
  expires_at  = created_at + interval '24 hours',
  purge_after = now() + interval '30 days'
where status in ('closed', 'archived')
  and expires_at is null;

-- Catch-all: any row still without expires_at (unexpected status or future gap).
update public.lfg_posts
set
  expires_at  = created_at + interval '24 hours',
  purge_after = created_at + interval '24 hours' + interval '30 days'
where expires_at is null;

-- Index for future expiry-based feed filtering.
-- Does not affect current feed queries (which still filter by created_at).
-- Partial index on status = 'active' keeps it narrow.
create index if not exists lfg_posts_active_expires_feed_idx
  on public.lfg_posts (lfg_type, expires_at desc)
  where status = 'active';
