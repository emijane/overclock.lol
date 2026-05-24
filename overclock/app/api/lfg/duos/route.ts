import { NextResponse } from "next/server";

import {
  getDuosFeedPage,
  type DuosFeedPageDto,
} from "@/features/lfg/duos-feed";
import {
  normalizeLFGSearchQuery,
  normalizeLFGRankFilterOption,
  normalizeLFGRankBounds,
  parseLFGFeedFilters,
} from "@/lib/lfg/lfg-feed-filters";
import { duosPerfLog } from "@/lib/dev/perf-log";
import { getCurrentUserId } from "@/lib/profiles/get-current-profile";

function isFixturesEnabled(value: string | null) {
  return value === "1";
}

function parseCursor(searchParams: URLSearchParams) {
  const createdAt = searchParams.get("cursor_created_at");
  const id = searchParams.get("cursor_id");

  if (!createdAt || !id) {
    return null;
  }

  return { createdAt, id };
}

function buildResponse(body: DuosFeedPageDto) {
  return NextResponse.json(body);
}

export async function GET(request: Request) {
  const tRequest = Date.now();

  try {
    const requestUrl = new URL(request.url);
    const searchParams = requestUrl.searchParams;
    const rawMinRank = searchParams.get("min_rank") ?? undefined;
    const rawMaxRank = searchParams.get("max_rank") ?? undefined;
    const rawSearch = searchParams.get("search") ?? undefined;
    const normalizedSearch = normalizeLFGSearchQuery(rawSearch);
    const normalizedRankBounds = normalizeLFGRankBounds({
      maxRank: normalizeLFGRankFilterOption(rawMaxRank),
      minRank: normalizeLFGRankFilterOption(rawMinRank),
    });
    const viewerProfileId = await getCurrentUserId();
    const dto = await getDuosFeedPage({
      cursor: parseCursor(searchParams),
      filters: parseLFGFeedFilters({
        lookingFor: searchParams.get("looking_for") ?? undefined,
        maxRank: normalizedRankBounds.maxRank,
        minRank: normalizedRankBounds.minRank,
        mode: searchParams.get("mode") ?? undefined,
        region: searchParams.get("region") ?? undefined,
        role: searchParams.get("role") ?? undefined,
        search: normalizedSearch,
      }),
      useFixtures: isFixturesEnabled(searchParams.get("fixtures")),
      viewerProfileId,
    });

    duosPerfLog("GET /api/lfg/duos total", tRequest, dto.posts.length);
    return buildResponse(dto);
  } catch {
    duosPerfLog("GET /api/lfg/duos total", tRequest, 0);
    return NextResponse.json(
      {
        error: "Unable to load more duos right now.",
      },
      { status: 500 }
    );
  }
}
