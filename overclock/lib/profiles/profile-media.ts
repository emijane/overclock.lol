export const PROFILE_MEDIA_BUCKET = "profile-media";
export const PROFILE_COVER_IMAGE_MAX_MB = 5;
export const PROFILE_COVER_IMAGE_MAX_BYTES =
  PROFILE_COVER_IMAGE_MAX_MB * 1024 * 1024;
export const PROFILE_COVER_ASPECT_RATIO = 10 / 3;
export const PROFILE_COVER_OUTPUT_WIDTH = 1500;
export const PROFILE_COVER_OUTPUT_HEIGHT = 450;
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

export function getProfileCoverUrl(
  coverImagePath: string | null,
  coverImageUpdatedAt: string | null
) {
  if (!coverImagePath || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }

  const baseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const coverUrl = new URL(
    `/storage/v1/object/public/${PROFILE_MEDIA_BUCKET}/${coverImagePath}`,
    baseUrl
  );

  if (coverImageUpdatedAt) {
    coverUrl.searchParams.set("v", coverImageUpdatedAt);
  }

  return coverUrl.toString();
}
