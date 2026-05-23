import type { ProfileBadge } from "@/lib/badges/badge-types";
import type {
  CompetitiveProfile,
  CompetitiveRole,
  CompetitiveRoleProfile,
} from "@/lib/competitive/competitive-profile-types";
import {
  EMPTY_PROFILE_HERO_POOLS,
  type ProfileHeroPools,
  normalizeHeroPoolSelections,
  isHeroPoolRoleOption,
} from "@/lib/heroes/profile-hero-pools";
import {
  getLFGRankRangeTiers,
  type LFGFeedFilters,
} from "@/lib/lfg/lfg-feed-filters";
import {
  isLFGGameMode,
  isLFGType,
  normalizeLFGLookingForRoles,
  type LFGHeroSnapshot,
  type LFGPost,
  type LFGType,
  type StackMember,
} from "@/lib/lfg/lfg-post-types";
import type { LFGInviteStateMap, ProfileInviteState } from "@/lib/matches/play-invite-types";
import { getProfileAvatarUrl, getProfileCoverUrl } from "@/lib/profiles/profile-media";
import { stacksPerfLog } from "@/lib/dev/perf-log";
import { createClient } from "@/lib/supabase/server";

type StackRequestState = "none" | "pending" | "accepted" | "declined";

export type LFGFeedPageDto = {
  inviteStates: LFGInviteStateMap;
  posts: LFGPost[];
  stackRequestStates: Record<string, StackRequestState>;
  viewerBundle: {
    activePostCounts: Record<CompetitiveRole, number>;
    competitiveProfile: CompetitiveProfile | null;
    heroPools: ProfileHeroPools;
  } | null;
};

function isCompetitiveRole(value: unknown): value is CompetitiveRole {
  return value === "tank" || value === "dps" || value === "support";
}

function normalizeBadges(value: unknown): ProfileBadge[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }

      const candidate = entry as Record<string, unknown>;

      if (
        typeof candidate.id !== "string" ||
        typeof candidate.slug !== "string" ||
        typeof candidate.label !== "string"
      ) {
        return null;
      }

      return {
        id: candidate.id,
        slug: candidate.slug,
        label: candidate.label,
        description:
          typeof candidate.description === "string" ? candidate.description : null,
        icon: typeof candidate.icon === "string" ? candidate.icon : null,
        color: typeof candidate.color === "string" ? candidate.color : null,
        grantedAt:
          typeof candidate.grantedAt === "string" ? candidate.grantedAt : null,
      } satisfies ProfileBadge;
    })
    .filter((entry): entry is ProfileBadge => Boolean(entry));
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

function normalizeStackMembers(value: unknown): StackMember[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }

      const candidate = entry as Record<string, unknown>;

      if (!isCompetitiveRole(candidate.role) || typeof candidate.profileId !== "string") {
        return null;
      }

      return {
        profileId: candidate.profileId,
        username:
          typeof candidate.username === "string" ? candidate.username : null,
        displayName:
          typeof candidate.displayName === "string" ? candidate.displayName : null,
        avatarUrl: getProfileAvatarUrl(
          typeof candidate.avatarUrl === "string" ? candidate.avatarUrl : null,
          typeof candidate.avatarUpdatedAt === "string"
            ? candidate.avatarUpdatedAt
            : null
        ),
        rankTier:
          typeof candidate.rankTier === "string" ? candidate.rankTier : null,
        rankDivision:
          typeof candidate.rankDivision === "number" ? candidate.rankDivision : null,
        role: candidate.role,
        isOwner: candidate.isOwner === true,
      } satisfies StackMember;
    })
    .filter((entry): entry is StackMember => Boolean(entry));
}

function normalizeRoleProfiles(value: unknown): CompetitiveRoleProfile[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }

      const candidate = entry as Record<string, unknown>;

      if (
        typeof candidate.id !== "string" ||
        typeof candidate.profileId !== "string" ||
        !isCompetitiveRole(candidate.role) ||
        typeof candidate.rankTier !== "string"
      ) {
        return null;
      }

      return {
        id: candidate.id,
        profileId: candidate.profileId,
        role: candidate.role,
        rankTier: candidate.rankTier as CompetitiveRoleProfile["rankTier"],
        rankDivision:
          typeof candidate.rankDivision === "number" ? candidate.rankDivision : null,
        enabled: candidate.enabled === true,
        createdAt:
          typeof candidate.createdAt === "string" ? candidate.createdAt : "",
        updatedAt:
          typeof candidate.updatedAt === "string" ? candidate.updatedAt : "",
      } satisfies CompetitiveRoleProfile;
    })
    .filter((entry): entry is CompetitiveRoleProfile => Boolean(entry));
}

function normalizeHeroPools(value: unknown): ProfileHeroPools {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return EMPTY_PROFILE_HERO_POOLS;
  }

  const candidate = value as Record<string, unknown>;
  const rawRoles = Array.isArray(candidate.roles)
    ? candidate.roles.filter((item): item is string => typeof item === "string")
    : [];

  return {
    roles: rawRoles.filter((role): role is ProfileHeroPools["roles"][number] =>
      isHeroPoolRoleOption(role)
    ),
    heroPicks: normalizeHeroPoolSelections(candidate.heroPicks),
  };
}

function normalizeCompetitiveProfile(value: unknown): CompetitiveProfile | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (typeof candidate.profileId !== "string") {
    return null;
  }

  return {
    profileId: candidate.profileId,
    mainRole: isCompetitiveRole(candidate.mainRole) ? candidate.mainRole : null,
    platform:
      typeof candidate.platform === "string"
        ? (candidate.platform as CompetitiveProfile["platform"])
        : null,
    roles: normalizeRoleProfiles(candidate.roles),
  };
}

function normalizePosts(value: unknown) {
  const posts: LFGPost[] = [];
  const inviteStates: LFGInviteStateMap = {};
  const stackRequestStates: Record<string, StackRequestState> = {};

  if (!Array.isArray(value)) {
    return { posts, inviteStates, stackRequestStates };
  }

  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }

    const candidate = entry as Record<string, unknown>;

    if (
      typeof candidate.id !== "string" ||
      typeof candidate.profileId !== "string" ||
      typeof candidate.title !== "string" ||
      typeof candidate.createdAt !== "string" ||
      !isCompetitiveRole(candidate.postingRole) ||
      typeof candidate.rankTier !== "string" ||
      !isLFGType(String(candidate.lfgType ?? "")) ||
      !isLFGGameMode(String(candidate.gameMode ?? ""))
    ) {
      continue;
    }

    const author =
      candidate.author && typeof candidate.author === "object" && !Array.isArray(candidate.author)
        ? (candidate.author as Record<string, unknown>)
        : {};
    const inviteState =
      candidate.inviteState === "connected" || candidate.inviteState === "invite_sent"
        ? candidate.inviteState
        : "invite_to_play";
    const stackRequestState =
      candidate.stackRequestState === "pending" ||
      candidate.stackRequestState === "accepted" ||
      candidate.stackRequestState === "declined"
        ? candidate.stackRequestState
        : "none";

    inviteStates[candidate.id] = inviteState satisfies ProfileInviteState;
    stackRequestStates[candidate.id] = stackRequestState;

    posts.push({
      id: candidate.id,
      profileId: candidate.profileId,
      lfgType: candidate.lfgType as LFGType,
      gameMode: candidate.gameMode as LFGPost["gameMode"],
      title: candidate.title,
      status:
        candidate.status === "filled" ||
        candidate.status === "closed" ||
        candidate.status === "expired" ||
        candidate.status === "archived"
          ? candidate.status
          : "active",
      lookingForRoles: normalizeLFGLookingForRoles(
        Array.isArray(candidate.lookingForRoles)
          ? candidate.lookingForRoles.filter((role): role is string => typeof role === "string")
          : []
      ),
      postingRole: candidate.postingRole as CompetitiveRole,
      platform:
        typeof candidate.platform === "string" ? candidate.platform : null,
      rankTier: candidate.rankTier,
      rankDivision:
        typeof candidate.rankDivision === "number" ? candidate.rankDivision : null,
      region: typeof candidate.region === "string" ? candidate.region : null,
      timezone:
        typeof candidate.timezone === "string" ? candidate.timezone : null,
      heroPool: normalizeHeroPool(candidate.heroPool),
      createdAt: candidate.createdAt,
      maxGroupSize:
        typeof candidate.maxGroupSize === "number" ? candidate.maxGroupSize : null,
      currentMemberCount:
        typeof candidate.currentMemberCount === "number"
          ? candidate.currentMemberCount
          : 1,
      description: null,
      stackMembers: normalizeStackMembers(candidate.stackMembers),
      author: {
        username:
          typeof author.username === "string" ? author.username : null,
        displayName:
          typeof author.displayName === "string" ? author.displayName : null,
        avatarUrl: getProfileAvatarUrl(
          typeof author.avatarUrl === "string" ? author.avatarUrl : null,
          typeof author.avatarUpdatedAt === "string" ? author.avatarUpdatedAt : null
        ),
        coverImageUrl: getProfileCoverUrl(
          typeof author.coverImagePath === "string" ? author.coverImagePath : null,
          typeof author.coverImageUpdatedAt === "string"
            ? author.coverImageUpdatedAt
            : null
        ),
        lastSeenAt:
          typeof author.lastSeenAt === "string" ? author.lastSeenAt : null,
        isLookingToPlay: author.isLookingToPlay === true,
        hideOfflinePresence: author.hideOfflinePresence === true,
        badges: normalizeBadges(author.badges),
      },
    });
  }

  return { posts, inviteStates, stackRequestStates };
}

export async function getLFGFeedPageDto(input: {
  filters?: LFGFeedFilters;
  lfgType: LFGType;
  viewerProfileId?: string | null;
}): Promise<LFGFeedPageDto> {
  const supabase = await createClient();
  const tRpc = Date.now();
  const { data, error } = await supabase.rpc("get_lfg_feed_page_dto", {
    p_lfg_type: input.lfgType,
    p_viewer_profile_id: input.viewerProfileId ?? null,
    p_role: input.filters?.role ?? null,
    p_looking_for: input.filters?.lookingFor ?? null,
    p_mode: input.filters?.mode ?? null,
    p_region: input.filters?.region ?? null,
    p_search: input.filters?.search ?? null,
    p_rank_tiers:
      input.filters?.minRank || input.filters?.maxRank
        ? getLFGRankRangeTiers({
            minRank: input.filters?.minRank,
            maxRank: input.filters?.maxRank,
          })
        : null,
  });
  const record =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};
  const rawPosts = Array.isArray(record.posts) ? record.posts : [];
  stacksPerfLog("getLFGFeedPageDto rpc", tRpc, rawPosts.length);

  if (error) {
    throw error;
  }

  const viewerBundle =
    record.viewerBundle &&
    typeof record.viewerBundle === "object" &&
    !Array.isArray(record.viewerBundle)
      ? (record.viewerBundle as Record<string, unknown>)
      : null;
  const tNormalize = Date.now();
  const { posts, inviteStates, stackRequestStates } = normalizePosts(record.posts);
  stacksPerfLog("getLFGFeedPageDto normalizePosts", tNormalize, posts.length);

  return {
    posts,
    inviteStates,
    stackRequestStates,
    viewerBundle: viewerBundle
      ? {
          activePostCounts: {
            tank:
              typeof viewerBundle.activePostCounts === "object" &&
              viewerBundle.activePostCounts &&
              !Array.isArray(viewerBundle.activePostCounts) &&
              typeof (viewerBundle.activePostCounts as Record<string, unknown>).tank === "number"
                ? ((viewerBundle.activePostCounts as Record<string, unknown>).tank as number)
                : 0,
            dps:
              typeof viewerBundle.activePostCounts === "object" &&
              viewerBundle.activePostCounts &&
              !Array.isArray(viewerBundle.activePostCounts) &&
              typeof (viewerBundle.activePostCounts as Record<string, unknown>).dps === "number"
                ? ((viewerBundle.activePostCounts as Record<string, unknown>).dps as number)
                : 0,
            support:
              typeof viewerBundle.activePostCounts === "object" &&
              viewerBundle.activePostCounts &&
              !Array.isArray(viewerBundle.activePostCounts) &&
              typeof (viewerBundle.activePostCounts as Record<string, unknown>).support === "number"
                ? ((viewerBundle.activePostCounts as Record<string, unknown>).support as number)
                : 0,
          },
          competitiveProfile: normalizeCompetitiveProfile(viewerBundle.competitiveProfile),
          heroPools: normalizeHeroPools(viewerBundle.heroPools),
        }
      : null,
  };
}
