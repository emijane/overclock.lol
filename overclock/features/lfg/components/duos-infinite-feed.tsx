"use client";

import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import type { LFGFeedFilters } from "@/lib/lfg/lfg-feed-filters";
import type { LFGPost } from "@/lib/lfg/lfg-post-types";
import type { LFGInviteStateMap, InviteViewerState } from "@/lib/matches/play-invite-types";

import type { DuosFeedPageDto } from "../duos-feed";
import { LFGPostList } from "./lfg-post-list";

type DuosInfiniteFeedProps = {
  currentProfileId?: string | null;
  emptyStateDescription: string;
  emptyStateTitle: string;
  errorMessage?: string | null;
  feedFilters?: LFGFeedFilters;
  hasActiveFilters?: boolean;
  initialHasMore: boolean;
  initialInviteStates: LFGInviteStateMap;
  initialNextCursor: DuosFeedPageDto["nextCursor"];
  initialPosts: LFGPost[];
  retryHref?: string;
  tone?: "default" | "duos";
  useFixtures?: boolean;
  viewerState?: InviteViewerState;
};

function buildDuosFeedQuery(input: {
  cursor?: DuosFeedPageDto["nextCursor"];
  filters?: LFGFeedFilters;
  useFixtures?: boolean;
}) {
  const searchParams = new URLSearchParams();

  if (input.cursor) {
    searchParams.set("cursor_created_at", input.cursor.createdAt);
    searchParams.set("cursor_id", input.cursor.id);
  }

  if (input.filters?.mode) {
    searchParams.set("mode", input.filters.mode);
  }

  if (input.filters?.role) {
    searchParams.set("role", input.filters.role);
  }

  if (input.filters?.lookingFor) {
    searchParams.set("looking_for", input.filters.lookingFor);
  }

  if (input.filters?.minRank) {
    searchParams.set("min_rank", input.filters.minRank);
  }

  if (input.filters?.maxRank) {
    searchParams.set("max_rank", input.filters.maxRank);
  }

  if (input.filters?.region) {
    searchParams.set("region", input.filters.region);
  }

  if (input.filters?.search) {
    searchParams.set("search", input.filters.search);
  }

  if (input.useFixtures) {
    searchParams.set("fixtures", "1");
  }

  return searchParams.toString();
}

function mergePosts(previousPosts: LFGPost[], incomingPosts: LFGPost[]) {
  const postsById = new Map(previousPosts.map((post) => [post.id, post]));

  for (const post of incomingPosts) {
    if (!postsById.has(post.id)) {
      postsById.set(post.id, post);
    }
  }

  return Array.from(postsById.values());
}

function DuosAppendStatus({
  errorMessage,
  hasMore,
  isLoading,
  onRetry,
  sentinelRef,
}: {
  errorMessage: string | null;
  hasMore: boolean;
  isLoading: boolean;
  onRetry: () => void;
  sentinelRef: RefObject<HTMLDivElement | null>;
}) {
  if (errorMessage) {
    return (
      <div className="px-5 pb-6 pt-0.5 sm:px-6">
        <div className="flex items-center justify-between rounded-[10px] border border-amber-400/20 bg-amber-300/[0.05] px-3 py-2.5">
          <p className="oc-profile-meta text-[11px] text-amber-100/80">{errorMessage}</p>
          <button
            type="button"
            onClick={onRetry}
            className="oc-profile-display inline-flex h-8 items-center rounded-[8px] border border-white/[0.08] bg-white/[0.03] px-3 text-[12px] font-semibold text-zinc-100 transition hover:border-white/[0.14] hover:bg-white/[0.06]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!hasMore) {
    return null;
  }

  return (
    <div className="px-5 pb-6 pt-0.5 sm:px-6">
      <div
        ref={sentinelRef}
        aria-hidden="true"
        className="h-12 rounded-[10px] border border-dashed border-white/[0.05] bg-white/[0.012]"
      />
      {isLoading ? (
        <div className="mt-2 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={`duos-feed-loading-${index}`}
              className="h-48 animate-pulse rounded-[10px] border border-white/[0.04] bg-white/[0.02]"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DuosInfiniteFeed({
  currentProfileId,
  emptyStateDescription,
  emptyStateTitle,
  errorMessage,
  feedFilters,
  hasActiveFilters = false,
  initialHasMore,
  initialInviteStates,
  initialNextCursor,
  initialPosts,
  retryHref,
  tone = "duos",
  useFixtures = false,
  viewerState = "guest",
}: DuosInfiniteFeedProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [inviteStates, setInviteStates] = useState(initialInviteStates);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [appendError, setAppendError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);

  const loadNextPage = useCallback(async () => {
    if (isFetchingRef.current || !hasMore || !nextCursor) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setAppendError(null);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const query = buildDuosFeedQuery({
        cursor: nextCursor,
        filters: feedFilters,
        useFixtures,
      });
      const response = await fetch(`/api/lfg/duos?${query}`, {
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Unable to load more duos right now.");
      }

      const nextPage = (await response.json()) as DuosFeedPageDto;

      startTransition(() => {
        setPosts((previousPosts) => mergePosts(previousPosts, nextPage.posts));
        setInviteStates((previousStates) => ({
          ...previousStates,
          ...nextPage.inviteStates,
        }));
        setHasMore(nextPage.hasMore);
        setNextCursor(nextPage.nextCursor);
      });
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      setAppendError(
        error instanceof Error ? error.message : "Unable to load more duos right now."
      );
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }

      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [feedFilters, hasMore, nextCursor, useFixtures]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasMore) {
      return;
    }

    const scrollRoot = scrollContainerRef.current;
    const isScrollContainer =
      scrollRoot !== null &&
      window.getComputedStyle(scrollRoot).overflowY !== "visible";

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadNextPage();
        }
      },
      {
        root: isScrollContainer ? scrollRoot : null,
        rootMargin: "1200px 0px",
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadNextPage]);

  return (
    <div
      ref={scrollContainerRef}
      className="flex min-h-0 flex-1 flex-col lg:overflow-y-auto oc-sidebar-scroll"
    >
      <LFGPostList
        currentProfileId={currentProfileId}
        emptyStateDescription={emptyStateDescription}
        emptyStateTitle={emptyStateTitle}
        errorMessage={errorMessage}
        hasActiveFilters={hasActiveFilters}
        inviteStates={inviteStates}
        layout="grid-3"
        posts={posts}
        retryHref={retryHref}
        tone={tone}
        viewerState={viewerState}
      />
      {!errorMessage && posts.length > 0 ? (
        <DuosAppendStatus
          errorMessage={appendError}
          hasMore={hasMore}
          isLoading={isLoading || isPending}
          onRetry={() => {
            void loadNextPage();
          }}
          sentinelRef={sentinelRef}
        />
      ) : null}
    </div>
  );
}
