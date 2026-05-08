import { createClient } from "@/lib/supabase/server";
import { getProfileAvatarUrl } from "@/lib/profiles/profile-media";
import {
  normalizeProfileSearchQuery,
  PROFILE_SEARCH_RESULT_LIMIT,
  type PublicProfileSearchResult,
} from "@/lib/profiles/profile-search-shared";

type ProfileSearchRow = {
  avatar_updated_at: string | null;
  avatar_url: string | null;
  display_name: string | null;
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
  excludeUsername?: string | null
) {
  const query = normalizeProfileSearchQuery(rawQuery);
  const normalizedExcludedUsername = normalizeProfileSearchQuery(excludeUsername);

  if (!query) {
    return [];
  }

  const supabase = await createClient();
  const escapedQuery = escapeLikePattern(query);

  const [usernameMatchesResult, displayNameMatchesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, avatar_url, avatar_updated_at")
      .not("username", "is", null)
      .ilike("username", `${escapedQuery}%`)
      .limit(PROFILE_SEARCH_RESULT_LIMIT),
    supabase
      .from("profiles")
      .select("username, display_name, avatar_url, avatar_updated_at")
      .not("username", "is", null)
      .ilike("display_name", `%${escapedQuery}%`)
      .limit(PROFILE_SEARCH_RESULT_LIMIT),
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

    if (
      normalizedExcludedUsername &&
      mappedResult.username.toLowerCase() ===
        normalizedExcludedUsername.toLowerCase()
    ) {
      continue;
    }

    seenUsernames.add(mappedResult.username);
    results.push(mappedResult);

    if (results.length >= PROFILE_SEARCH_RESULT_LIMIT) {
      break;
    }
  }

  return results;
}
