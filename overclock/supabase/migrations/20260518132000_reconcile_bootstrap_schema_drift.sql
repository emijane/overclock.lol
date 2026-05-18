-- Reconcile known drift between the linked database and the historical repo
-- migration chain now that the missing bootstrap is source-controlled.
--
-- Drift confirmed from the linked public schema:
--   - public.profiles no longer has the legacy platform column.
--   - public.lfg_posts has an updated_at column used by later repo functions.

alter table public.lfg_posts
  add column if not exists updated_at timestamptz;

update public.lfg_posts
set updated_at = coalesce(updated_at, closed_at, expired_at, expires_at, created_at, now())
where updated_at is null;

alter table public.lfg_posts
  alter column updated_at set default now(),
  alter column updated_at set not null;

alter table public.profiles
  drop column if exists platform;
