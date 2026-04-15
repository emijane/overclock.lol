import {
  FEATURED_CLIP_PLATFORMS,
  type ProfileFeaturedClip,
} from "@/lib/profiles/featured-clip-shared";
import { createClient } from "@/lib/supabase/server";

const FEATURED_CLIP_SELECT =
  "id, profile_id, platform, url, title, thumbnail_url, position" as const;

type FeaturedClipRow = {
  id: string;
  platform: string;
  position: number;
  thumbnail_url: string | null;
  title: string | null;
  url: string;
};

function mapFeaturedClipRow(row: FeaturedClipRow): ProfileFeaturedClip | null {
  const platform = FEATURED_CLIP_PLATFORMS.find((value) => value === row.platform);

  if (!platform) {
    return null;
  }

  return {
    id: row.id,
    platform,
    position: row.position,
    thumbnailUrl: row.thumbnail_url,
    title: row.title,
    url: row.url,
  };
}

export async function getProfileFeaturedClips(profileId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_featured_clips")
    .select(FEATURED_CLIP_SELECT)
    .eq("profile_id", profileId)
    .order("position", { ascending: true })
    .limit(2);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => mapFeaturedClipRow(row as FeaturedClipRow))
    .filter((row): row is ProfileFeaturedClip => Boolean(row));
}
