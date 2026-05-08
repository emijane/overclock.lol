export const PROFILE_MEDIA_BUCKET = "profile-media";

export const PROFILE_COVER_IMAGE_MAX_MB = 10;
export const PROFILE_COVER_IMAGE_MAX_BYTES =
  PROFILE_COVER_IMAGE_MAX_MB * 1024 * 1024;
export const PROFILE_COVER_ASPECT_RATIO = 30 / 7;
export const PROFILE_COVER_OUTPUT_WIDTH = 1500;
export const PROFILE_COVER_OUTPUT_HEIGHT = 350;

export const PROFILE_AVATAR_MAX_MB = 5;
export const PROFILE_AVATAR_MAX_BYTES = PROFILE_AVATAR_MAX_MB * 1024 * 1024;
export const PROFILE_AVATAR_OUTPUT_SIZE = 400;
export const PROFILE_AVATAR_DEFAULT_PATH = "profile-pictures/default_icon.png";

export const PROFILE_MEDIA_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const PROFILE_MEDIA_IMAGE_ACCEPT_ATTRIBUTE =
  PROFILE_MEDIA_IMAGE_MIME_TYPES.join(",");

export function getProfileCoverPath(userId: string) {
  return `covers/${userId}/cover`;
}

export function getProfileAvatarPath(userId: string) {
  return `profile-pictures/${userId}/avatar`;
}

function buildStorageUrl(path: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }

  const baseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
  return new URL(
    `/storage/v1/object/public/${PROFILE_MEDIA_BUCKET}/${path}`,
    baseUrl
  ).toString();
}

export function getProfileCoverUrl(
  coverImagePath: string | null,
  coverImageUpdatedAt: string | null
) {
  if (!coverImagePath) {
    return null;
  }

  const base = buildStorageUrl(coverImagePath);

  if (!base) {
    return null;
  }

  if (coverImageUpdatedAt) {
    const url = new URL(base);
    url.searchParams.set("v", coverImageUpdatedAt);
    return url.toString();
  }

  return base;
}

export function getProfileAvatarUrl(
  avatarUrl: string | null,
  avatarUpdatedAt: string | null
) {
  const path = avatarUrl ?? PROFILE_AVATAR_DEFAULT_PATH;
  const base = buildStorageUrl(path);

  if (!base) {
    return null;
  }

  if (avatarUrl && avatarUpdatedAt) {
    const url = new URL(base);
    url.searchParams.set("v", avatarUpdatedAt);
    return url.toString();
  }

  return base;
}
