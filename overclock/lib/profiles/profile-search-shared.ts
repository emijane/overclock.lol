export const PROFILE_SEARCH_QUERY_MAX_LENGTH = 40;
export const PROFILE_SEARCH_RESULT_LIMIT = 6;
export const PROFILE_SEARCH_DROPDOWN_LIMIT = 5;
export const PROFILE_SEARCH_PAGE_RESULT_LIMIT = 20;

export type PublicProfileSearchResult = {
  avatarUrl: string | null;
  displayName: string | null;
  username: string;
};

export function normalizeProfileSearchQuery(input: string | null | undefined) {
  if (!input) {
    return "";
  }

  const trimmed = input.trim().replace(/^@+/, "");

  if (!trimmed) {
    return "";
  }

  return trimmed.slice(0, PROFILE_SEARCH_QUERY_MAX_LENGTH);
}
