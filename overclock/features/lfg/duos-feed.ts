import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import { getCompetitiveProfile } from "@/lib/competitive/competitive-profile";
import { duosPerfLog } from "@/lib/dev/perf-log";
import type { LFGFeedFilters } from "@/lib/lfg/lfg-feed-filters";
import type { LFGPost } from "@/lib/lfg/lfg-post-types";
import {
  getActiveLFGPostCountsByRole,
  getActiveLFGPostsPage,
  type LFGFeedCursor,
} from "@/lib/lfg/posts/posts-queries";
import type { LFGInviteStateMap } from "@/lib/matches/play-invite-types";
import { getProfileHeroPools, type ProfileHeroPools } from "@/lib/heroes/profile-hero-pools";

import { DUOS_PLACEHOLDER_POSTS } from "./dev-fixtures";

export const DUOS_FEED_PAGE_SIZE = 16;

type DuosViewerBundle = {
  activePostCounts: Record<CompetitiveRole, number>;
  competitiveProfile: Awaited<ReturnType<typeof getCompetitiveProfile>> | null;
  heroPools: ProfileHeroPools;
} | null;

export type DuosFeedPageDto = {
  hasMore: boolean;
  inviteStates: LFGInviteStateMap;
  nextCursor: LFGFeedCursor | null;
  posts: LFGPost[];
};

export type DuosFeedInitialPageDto = DuosFeedPageDto & {
  viewerBundle: DuosViewerBundle;
};

function compareFeedItems(a: Pick<LFGPost, "createdAt" | "id">, b: Pick<LFGPost, "createdAt" | "id">) {
  if (a.createdAt === b.createdAt) {
    return b.id.localeCompare(a.id);
  }

  return b.createdAt.localeCompare(a.createdAt);
}

function getFixturePage(input: {
  cursor?: LFGFeedCursor | null;
  limit: number;
}): DuosFeedPageDto {
  const orderedFixtures = [...DUOS_PLACEHOLDER_POSTS].sort(compareFeedItems);
  const filteredFixtures = input.cursor
    ? orderedFixtures.filter(
        (post) =>
          post.createdAt < input.cursor!.createdAt ||
          (post.createdAt === input.cursor!.createdAt && post.id < input.cursor!.id)
      )
    : orderedFixtures;
  const posts = filteredFixtures.slice(0, input.limit);
  const hasMore = filteredFixtures.length > input.limit;
  const lastPost = posts.at(-1) ?? null;

  return {
    hasMore,
    inviteStates: Object.fromEntries(posts.map((post) => [post.id, "invite_to_play"])),
    nextCursor: hasMore && lastPost ? { createdAt: lastPost.createdAt, id: lastPost.id } : null,
    posts,
  };
}

async function getDuosViewerBundle(
  viewerProfileId: string | null
): Promise<DuosViewerBundle> {
  if (!viewerProfileId) {
    return null;
  }

  const [activePostCounts, competitiveProfile, heroPools] = await Promise.all([
    getActiveLFGPostCountsByRole({
      lfgType: "duos",
      profileId: viewerProfileId,
    }),
    getCompetitiveProfile(viewerProfileId),
    getProfileHeroPools(viewerProfileId),
  ]);

  return {
    activePostCounts,
    competitiveProfile,
    heroPools,
  };
}

export async function getDuosFeedPage(input: {
  cursor?: LFGFeedCursor | null;
  filters?: LFGFeedFilters;
  limit?: number;
  useFixtures?: boolean;
  viewerProfileId?: string | null;
}): Promise<DuosFeedPageDto> {
  const tPage = Date.now();
  const limit = Math.max(1, Math.min(input.limit ?? DUOS_FEED_PAGE_SIZE, DUOS_FEED_PAGE_SIZE));

  if (input.useFixtures) {
    const fixturePage = getFixturePage({
      cursor: input.cursor,
      limit,
    });
    duosPerfLog("getDuosFeedPage fixtures", tPage, fixturePage.posts.length);
    return fixturePage;
  }

  const page = await getActiveLFGPostsPage({
    cursor: input.cursor,
    filters: input.filters,
    lfgType: "duos",
    limit,
    viewerProfileId: input.viewerProfileId ?? null,
  });

  duosPerfLog("getDuosFeedPage live", tPage, page.posts.length);
  return {
    hasMore: page.hasMore,
    inviteStates: page.inviteStates,
    nextCursor: page.nextCursor,
    posts: page.posts,
  };
}

export async function getDuosFeedInitialPage(input: {
  filters?: LFGFeedFilters;
  useFixtures?: boolean;
  viewerProfileId?: string | null;
}): Promise<DuosFeedInitialPageDto> {
  const tInitial = Date.now();
  const [page, viewerBundle] = await Promise.all([
    getDuosFeedPage({
      filters: input.filters,
      useFixtures: input.useFixtures,
      viewerProfileId: input.viewerProfileId,
    }),
    getDuosViewerBundle(input.viewerProfileId ?? null),
  ]);

  duosPerfLog("getDuosFeedInitialPage total", tInitial, page.posts.length);

  return {
    ...page,
    viewerBundle,
  };
}
