import { createClient } from "@/lib/supabase/server";
import { getProfileAvatarUrl } from "@/lib/profiles/profile-media";
import {
  normalizeProfileSearchQuery,
  PROFILE_SEARCH_RESULT_LIMIT,
  type PublicProfileSearchResult,
} from "@/lib/profiles/profile-search-shared";

export type { PublicProfileSearchResult };

type ProfileSearchRow = {
  avatar_updated_at: string | null;
  avatar_url: string | null;
  display_name: string | null;
  id?: string | null;
  username: string | null;
};

function mapProfileSearchRow(row: ProfileSearchRow): PublicProfileSearchResult | null {
  if (!row.username) {
    return null;
  }

  return {
    avatarUrl: getProfileAvatarUrl(row.avatar_url, row.avatar_updated_at),
    displayName: row.display_name,
    username: row.username,
  };
}

export async function searchPublicProfiles(
  rawQuery: string,
  limit = PROFILE_SEARCH_RESULT_LIMIT,
  viewerProfileId?: string | null
) {
  const query = normalizeProfileSearchQuery(rawQuery);

  if (!query) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_public_profiles_dto", {
    p_query: query,
    p_limit: limit,
    p_viewer_profile_id: viewerProfileId ?? null,
  });

  if (error) {
    throw error;
  }

  const rows = Array.isArray(data) ? data : [];
  const results: PublicProfileSearchResult[] = [];

  for (const row of rows) {
    const mappedResult = mapProfileSearchRow(row);

    if (!mappedResult) {
      continue;
    }

    results.push(mappedResult);
  }

  return results;
}
