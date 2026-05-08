-- Add custom avatar columns to profiles.
-- avatar_url stores the storage path (avatars/{userId}/avatar) or null for the default icon.
-- avatar_updated_at is used for cache-busting the CDN URL.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_updated_at timestamptz;

-- Profile media tracking.
-- Records every active and deactivated media file for a profile.
-- Deactivated records are scheduled for storage deletion after 7 days.
CREATE TABLE IF NOT EXISTS profile_media (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('avatar', 'cover')),
  is_active boolean NOT NULL DEFAULT true,
  deactivated_at timestamptz,
  delete_after timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profile_media_profile_id_idx ON profile_media(profile_id);
CREATE INDEX IF NOT EXISTS profile_media_pending_delete_idx
  ON profile_media(delete_after)
  WHERE delete_after IS NOT NULL AND NOT is_active;

ALTER TABLE profile_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_media_select_own"
  ON profile_media FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "profile_media_insert_own"
  ON profile_media FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "profile_media_update_own"
  ON profile_media FOR UPDATE TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Per-user upload rate-limit log.
-- Allows server actions to enforce max N uploads per hour without an in-process store.
CREATE TABLE IF NOT EXISTS profile_media_uploads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('avatar', 'cover')),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profile_media_uploads_rate_limit_idx
  ON profile_media_uploads(profile_id, media_type, uploaded_at);

ALTER TABLE profile_media_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_media_uploads_select_own"
  ON profile_media_uploads FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "profile_media_uploads_insert_own"
  ON profile_media_uploads FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- Storage RLS policies for the profile-media bucket.
-- Public read (covers and avatars are always public).
CREATE POLICY "profile_media_public_read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'profile-media');

-- Authenticated users can upload/replace their own avatar.
CREATE POLICY "profile_media_avatar_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-media' AND
    name = 'avatars/' || auth.uid()::text || '/avatar'
  );

CREATE POLICY "profile_media_avatar_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-media' AND
    name = 'avatars/' || auth.uid()::text || '/avatar'
  );

-- Authenticated users can upload/replace their own cover.
CREATE POLICY "profile_media_cover_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-media' AND
    name = 'covers/' || auth.uid()::text || '/cover'
  );

CREATE POLICY "profile_media_cover_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-media' AND
    name = 'covers/' || auth.uid()::text || '/cover'
  );
