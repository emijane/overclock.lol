-- Add a dedicated partial index for the stacks feed.
--
-- Problem:
--   The existing lfg_posts_public_active_feed_idx covers
--   (lfg_type, created_at desc) WHERE status = 'active'.
--   The existing lfg_posts_active_expires_feed_idx covers
--   (lfg_type, expires_at desc) WHERE status = 'active'.
--   Both partial predicates are limited to status = 'active'.
--
--   The stacks feed path in get_lfg_feed_page_dto uses:
--     WHERE lfg_type = 'stacks'
--       AND status IN ('active', 'filled')   -- filled stacks stay visible
--       AND expires_at > now()
--     ORDER BY created_at DESC
--     LIMIT 30
--
--   Rows with status = 'filled' are not covered by either existing index,
--   so the planner cannot use them for a full index scan on the stacks feed.
--
-- Fix:
--   Mirror lfg_posts_public_active_feed_idx with an extended partial predicate.
--   Using (lfg_type, created_at desc) lets the planner satisfy
--   ORDER BY created_at DESC LIMIT 30 via an index scan with no sort step.
--   The expires_at > now() filter is residual — recent posts are almost
--   always non-expired, so the first 30 matches are found quickly.
--
-- This migration is additive only. No existing indexes are dropped.
-- No RPC, RLS, or application behavior changes.

create index if not exists lfg_posts_stacks_feed_idx
  on public.lfg_posts (lfg_type, created_at desc)
  where status in ('active', 'filled');
