import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import type { ProfileBadge } from "@/lib/badges/badge-types";
import { getProfileAvatarUrl, getProfileCoverUrl } from "@/lib/profiles/profile-media";

import { STACK_MAX_GROUP_SIZE } from "../lfg-post-policy";
import {
  isLFGGameMode,
  isLFGType,
  normalizeLFGLookingForRoles,
} from "../lfg-post-types";
import type {
  LFGGameMode,
  LFGHeroSnapshot,
  LFGPost,
  LFGPostStatus,
  LFGType,
  StackMember,
} from "../lfg-post-types";

export function normalizeBadgeDefinition(value: unknown): ProfileBadge | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.slug !== "string" ||
    typeof candidate.label !== "string"
  ) {
    return null;
  }

  return {
    color: typeof candidate.color === "string" ? candidate.color : null,
    description:
      typeof candidate.description === "string" ? candidate.description : null,
    grantedAt:
      typeof candidate.granted_at === "string" ? candidate.granted_at : null,
    icon: typeof candidate.icon === "string" ? candidate.icon : null,
    id: candidate.id,
    label: candidate.label,
    slug: candidate.slug,
  };
}

export function normalizeHeroPoolSnapshot(value: unknown): LFGHeroSnapshot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const snapshots: LFGHeroSnapshot[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }

    const candidate = item as Record<string, unknown>;

    if (typeof candidate.id !== "string" || typeof candidate.label !== "string") {
      continue;
    }

    snapshots.push({
      id: candidate.id,
      imageSrc:
        typeof candidate.imageSrc === "string" ? candidate.imageSrc : null,
      label: candidate.label,
    });
  }

  return snapshots;
}

export function normalizeStatus(value: unknown): LFGPostStatus {
  return value === "filled" ||
    value === "closed" ||
    value === "expired" ||
    value === "archived"
    ? value
    : "active";
}

export function normalizeAuthor(value: unknown, badges: ProfileBadge[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      avatarUrl: null,
      badges,
      coverImageUrl: null,
      displayName: null,
      hideOfflinePresence: false,
      isLookingToPlay: false,
      lastSeenAt: null,
      username: null,
    };
  }

  const candidate = value as Record<string, unknown>;

  return {
    avatarUrl: getProfileAvatarUrl(
      typeof candidate.avatar_url === "string" ? candidate.avatar_url : null,
      typeof candidate.avatar_updated_at === "string"
        ? candidate.avatar_updated_at
        : null
    ),
    badges,
    coverImageUrl: getProfileCoverUrl(
      typeof candidate.cover_image_path === "string"
        ? candidate.cover_image_path
        : null,
      typeof candidate.cover_image_updated_at === "string"
        ? candidate.cover_image_updated_at
        : null
    ),
    displayName:
      typeof candidate.display_name === "string" ? candidate.display_name : null,
    hideOfflinePresence: candidate.hide_offline_presence === true,
    isLookingToPlay: candidate.is_looking_to_play === true,
    lastSeenAt:
      typeof candidate.last_seen_at === "string" ? candidate.last_seen_at : null,
    username: typeof candidate.username === "string" ? candidate.username : null,
  };
}

export function normalizeCompetitiveRole(value: unknown): CompetitiveRole {
  return value === "tank" || value === "dps" || value === "support"
    ? value
    : "support";
}

export function normalizeLFGType(value: unknown): LFGType {
  return typeof value === "string" && isLFGType(value) ? value : "duos";
}

export function normalizeLFGGameMode(value: unknown): LFGGameMode {
  return typeof value === "string" && isLFGGameMode(value) ? value : "ranked";
}

export function normalizeLookingForRoles(value: unknown) {
  if (!Array.isArray(value)) {
    return normalizeLFGLookingForRoles([]);
  }

  return normalizeLFGLookingForRoles(
    value.filter((role): role is string => typeof role === "string")
  );
}

export function normalizeStackMemberFromSnapshot(
  profileId: string,
  role: CompetitiveRole,
  snapshot: Record<string, unknown> | null,
  isOwner: boolean
): StackMember {
  return {
    avatarUrl: getProfileAvatarUrl(
      snapshot && typeof snapshot.avatar_url === "string" ? snapshot.avatar_url : null,
      null
    ),
    displayName:
      snapshot && typeof snapshot.display_name === "string"
        ? snapshot.display_name
        : null,
    isOwner,
    profileId,
    rankDivision:
      snapshot && typeof snapshot.rank_division === "number"
        ? snapshot.rank_division
        : null,
    rankTier:
      snapshot && typeof snapshot.rank_tier === "string"
        ? snapshot.rank_tier
        : null,
    role,
    username:
      snapshot && typeof snapshot.username === "string" ? snapshot.username : null,
  };
}

export function buildOwnerStackMember(
  row: Record<string, unknown>
): StackMember | null {
  const postId = typeof row.id === "string" ? row.id : null;
  const profileId = typeof row.profile_id === "string" ? row.profile_id : null;

  if (!postId || !profileId) {
    return null;
  }

  const profileRow =
    row.profiles && typeof row.profiles === "object" && !Array.isArray(row.profiles)
      ? (row.profiles as Record<string, unknown>)
      : null;

  return {
    avatarUrl: profileRow
      ? getProfileAvatarUrl(
          typeof profileRow.avatar_url === "string" ? profileRow.avatar_url : null,
          typeof profileRow.avatar_updated_at === "string"
            ? profileRow.avatar_updated_at
            : null
        )
      : null,
    displayName:
      profileRow && typeof profileRow.display_name === "string"
        ? profileRow.display_name
        : null,
    isOwner: true,
    profileId,
    rankDivision:
      profileRow && typeof profileRow.current_rank_division === "number"
        ? profileRow.current_rank_division
        : null,
    rankTier:
      profileRow && typeof profileRow.current_rank_tier === "string"
        ? profileRow.current_rank_tier
        : null,
    role: normalizeCompetitiveRole(row.posting_role),
    username:
      profileRow && typeof profileRow.username === "string"
        ? profileRow.username
        : null,
  };
}

export function normalizeLFGPostRow(
  row: Record<string, unknown>,
  badges: ProfileBadge[],
  stackMembers: StackMember[] = []
): LFGPost {
  return {
    author: normalizeAuthor(row.profiles, badges),
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    currentMemberCount:
      typeof row.current_member_count === "number" ? row.current_member_count : 1,
    description: null,
    gameMode: normalizeLFGGameMode(row.game_mode),
    heroPool: normalizeHeroPoolSnapshot(row.hero_pool_snapshot),
    id: typeof row.id === "string" ? row.id : "",
    lfgType: normalizeLFGType(row.lfg_type),
    lookingForRoles: normalizeLookingForRoles(row.looking_for_roles),
    maxGroupSize:
      typeof row.max_group_size === "number" ? row.max_group_size : STACK_MAX_GROUP_SIZE,
    profileId: typeof row.profile_id === "string" ? row.profile_id : null,
    postingRole: normalizeCompetitiveRole(row.posting_role),
    platform:
      typeof row.snapshot_platform === "string" ? row.snapshot_platform : null,
    rankDivision:
      typeof row.snapshot_rank_division === "number"
        ? row.snapshot_rank_division
        : null,
    rankTier:
      typeof row.snapshot_rank_tier === "string"
        ? row.snapshot_rank_tier
        : "Unranked",
    region: typeof row.snapshot_region === "string" ? row.snapshot_region : null,
    stackMembers,
    status: normalizeStatus(row.status),
    timezone:
      typeof row.snapshot_timezone === "string" ? row.snapshot_timezone : null,
    title: typeof row.title === "string" ? row.title : "",
  };
}

export type LFGCreateResult = {
  created: boolean;
  errorCode: string | null;
  postId: string | null;
};

export function normalizeLFGCreateResult(value: unknown): LFGCreateResult {
  if (typeof value === "string") {
    try {
      return normalizeLFGCreateResult(JSON.parse(value));
    } catch {
      return {
        created: false,
        errorCode: "invalid_response",
        postId: null,
      };
    }
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? normalizeLFGCreateResult(value[0])
      : {
          created: false,
          errorCode: "invalid_response",
          postId: null,
        };
  }

  if (!value || typeof value !== "object") {
    return {
      created: false,
      errorCode: "invalid_response",
      postId: null,
    };
  }

  const candidate = value as Record<string, unknown>;
  const nestedCandidate =
    candidate.create_lfg_post_atomic &&
    typeof candidate.create_lfg_post_atomic === "object" &&
    !Array.isArray(candidate.create_lfg_post_atomic)
      ? (candidate.create_lfg_post_atomic as Record<string, unknown>)
      : candidate;

  return {
    created: nestedCandidate.created === true,
    errorCode:
      typeof nestedCandidate.error_code === "string"
        ? nestedCandidate.error_code
        : null,
    postId:
      typeof nestedCandidate.post_id === "string" ? nestedCandidate.post_id : null,
  };
}

export type LFGCloseResult = {
  errorCode: string | null;
  lfgType: LFGType | null;
  updated: boolean;
};

export function normalizeLFGCloseResult(value: unknown): LFGCloseResult {
  if (typeof value === "string") {
    try {
      return normalizeLFGCloseResult(JSON.parse(value));
    } catch {
      return {
        errorCode: "invalid_response",
        lfgType: null,
        updated: false,
      };
    }
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? normalizeLFGCloseResult(value[0])
      : {
          errorCode: "invalid_response",
          lfgType: null,
          updated: false,
        };
  }

  if (!value || typeof value !== "object") {
    return {
      errorCode: "invalid_response",
      lfgType: null,
      updated: false,
    };
  }

  const candidate = value as Record<string, unknown>;
  const nestedCandidate =
    candidate.close_owned_lfg_post &&
    typeof candidate.close_owned_lfg_post === "object" &&
    !Array.isArray(candidate.close_owned_lfg_post)
      ? (candidate.close_owned_lfg_post as Record<string, unknown>)
      : candidate;

  return {
    errorCode:
      typeof nestedCandidate.error_code === "string"
        ? nestedCandidate.error_code
        : null,
    lfgType:
      typeof nestedCandidate.lfg_type === "string" && isLFGType(nestedCandidate.lfg_type)
        ? nestedCandidate.lfg_type
        : null,
    updated: nestedCandidate.updated === true,
  };
}
