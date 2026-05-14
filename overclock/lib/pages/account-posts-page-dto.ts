import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import type { LFGGameMode, LFGHeroSnapshot, LFGPost, LFGPostStatus, LFGType } from "@/lib/lfg/lfg-post-types";
import type { LFGPostDisplayStatus } from "@/lib/lfg/lfg-post-display-status";
import { createClient } from "@/lib/supabase/server";

type AccountPostsPageDto = {
  counts: Record<"all" | LFGPostDisplayStatus, number>;
  pagination: {
    currentPage: number;
    totalItems: number;
    totalPages: number;
  };
  posts: Array<
    Pick<
      LFGPost,
      | "createdAt"
      | "gameMode"
      | "heroPool"
      | "id"
      | "lfgType"
      | "postingRole"
      | "rankDivision"
      | "rankTier"
      | "status"
      | "title"
    > & {
      displayStatus: LFGPostDisplayStatus;
    }
  >;
};

function isCompetitiveRole(value: unknown): value is CompetitiveRole {
  return value === "tank" || value === "dps" || value === "support";
}

function isLFGType(value: unknown): value is LFGType {
  return value === "duos" || value === "stacks" || value === "teams" || value === "scrims";
}

function isLFGGameMode(value: unknown): value is LFGGameMode {
  return value === "ranked" || value === "quick_play";
}

function normalizeHeroPool(value: unknown): LFGHeroSnapshot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const heroPool: LFGHeroSnapshot[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }

    const candidate = entry as Record<string, unknown>;

    if (typeof candidate.id !== "string" || typeof candidate.label !== "string") {
      continue;
    }

    heroPool.push({
      id: candidate.id,
      label: candidate.label,
      imageSrc:
        typeof candidate.imageSrc === "string" ? candidate.imageSrc : null,
    });
  }

  return heroPool;
}

export async function getAccountPostsPageDto(input: {
  currentPage: number;
  profileId: string;
  selectedStatus: "all" | LFGPostDisplayStatus;
}): Promise<AccountPostsPageDto> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_account_posts_page_dto", {
    p_profile_id: input.profileId,
    p_status: input.selectedStatus,
    p_page: input.currentPage,
    p_page_size: 10,
  });

  if (error) {
    throw error;
  }

  const record =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};
  const counts =
    record.counts && typeof record.counts === "object" && !Array.isArray(record.counts)
      ? (record.counts as Record<string, unknown>)
      : {};
  const pagination =
    record.pagination &&
    typeof record.pagination === "object" &&
    !Array.isArray(record.pagination)
      ? (record.pagination as Record<string, unknown>)
      : {};
  const posts = Array.isArray(record.posts) ? record.posts : [];

  return {
    counts: {
      all: typeof counts.all === "number" ? counts.all : 0,
      active: typeof counts.active === "number" ? counts.active : 0,
      closed: typeof counts.closed === "number" ? counts.closed : 0,
      expired: typeof counts.expired === "number" ? counts.expired : 0,
    },
    pagination: {
      currentPage:
        typeof pagination.currentPage === "number" ? pagination.currentPage : 1,
      totalItems:
        typeof pagination.totalItems === "number" ? pagination.totalItems : 0,
      totalPages:
        typeof pagination.totalPages === "number" ? pagination.totalPages : 1,
    },
    posts: posts
      .map((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
          return null;
        }

        const candidate = entry as Record<string, unknown>;

        if (
          typeof candidate.id !== "string" ||
          typeof candidate.createdAt !== "string" ||
          typeof candidate.title !== "string" ||
          !isLFGType(candidate.lfgType) ||
          !isLFGGameMode(candidate.gameMode) ||
          !isCompetitiveRole(candidate.postingRole) ||
          typeof candidate.rankTier !== "string"
        ) {
          return null;
        }

        return {
          id: candidate.id,
          createdAt: candidate.createdAt,
          gameMode: candidate.gameMode as LFGGameMode,
          heroPool: normalizeHeroPool(candidate.heroPool),
          lfgType: candidate.lfgType as LFGType,
          postingRole: candidate.postingRole as CompetitiveRole,
          rankDivision:
            typeof candidate.rankDivision === "number" ? candidate.rankDivision : null,
          rankTier: candidate.rankTier,
          status:
            candidate.status === "filled" ||
            candidate.status === "closed" ||
            candidate.status === "expired" ||
            candidate.status === "archived"
              ? (candidate.status as LFGPostStatus)
              : "active",
          displayStatus:
            candidate.displayStatus === "closed" || candidate.displayStatus === "expired"
              ? candidate.displayStatus
              : "active",
          title: candidate.title,
        };
      })
      .filter(
        (
          entry
        ): entry is AccountPostsPageDto["posts"][number] => Boolean(entry)
      ),
  };
}
