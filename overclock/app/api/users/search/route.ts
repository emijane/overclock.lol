import { NextResponse } from "next/server";

import {
  searchPublicProfiles,
} from "@/lib/profiles/public-profile-search";
import {
  normalizeProfileSearchQuery,
  PROFILE_SEARCH_QUERY_MAX_LENGTH,
} from "@/lib/profiles/profile-search-shared";
import { isProfileSearchRateLimited } from "@/lib/profiles/profile-search-rate-limit";

export async function GET(request: Request) {
  if (isProfileSearchRateLimited(request)) {
    return NextResponse.json(
      {
        error: "Too many search requests. Please wait a moment and try again.",
      },
      { status: 429 }
    );
  }

  const requestUrl = new URL(request.url);
  const rawQuery = requestUrl.searchParams.get("q");
  const query = normalizeProfileSearchQuery(rawQuery);

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  if (query.length > PROFILE_SEARCH_QUERY_MAX_LENGTH) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchPublicProfiles(query);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to search profiles right now.",
      },
      { status: 500 }
    );
  }
}
