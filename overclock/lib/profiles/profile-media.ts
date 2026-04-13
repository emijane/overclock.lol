const PROFILE_MEDIA_BUCKET = "profile-media";

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
