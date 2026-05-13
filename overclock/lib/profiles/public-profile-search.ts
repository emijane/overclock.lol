import { createClient } from "@/lib/supabase/server";
import { getBlockedProfileIdsForViewer } from "@/lib/blocks/user-blocks";
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

function escapeLikePattern(value: string) {
  return value.replace(/([%_\\])/g, "\\$1");
}

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
  const escapedQuery = escapeLikePattern(query);
  const blockedProfileIds = viewerProfileId
    ? await getBlockedProfileIdsForViewer(viewerProfileId)
    : [];

  const usernameQuery = supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, avatar_updated_at")
    .not("username", "is", null)
    .ilike("username", `${escapedQuery}%`)
    .limit(limit);
  const displayNameQuery = supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, avatar_updated_at")
    .not("username", "is", null)
    .ilike("display_name", `%${escapedQuery}%`)
    .limit(limit);

  if (blockedProfileIds.length > 0) {
    const filter = `(${blockedProfileIds.join(",")})`;
    usernameQuery.not("id", "in", filter);
    displayNameQuery.not("id", "in", filter);
  }

  const [usernameMatchesResult, displayNameMatchesResult] = await Promise.all([
    usernameQuery,
    displayNameQuery,
  ]);

  if (usernameMatchesResult.error) {
    throw usernameMatchesResult.error;
  }

  if (displayNameMatchesResult.error) {
    throw displayNameMatchesResult.error;
  }

  const mergedResults = [
    ...(usernameMatchesResult.data ?? []),
    ...(displayNameMatchesResult.data ?? []),
  ];
  const seenUsernames = new Set<string>();
  const results: PublicProfileSearchResult[] = [];

  for (const row of mergedResults) {
    const mappedResult = mapProfileSearchRow(row);

    if (!mappedResult || seenUsernames.has(mappedResult.username)) {
      continue;
    }

    seenUsernames.add(mappedResult.username);
    results.push(mappedResult);

    if (results.length >= limit) {
      break;
    }
  }

  return results;
}
