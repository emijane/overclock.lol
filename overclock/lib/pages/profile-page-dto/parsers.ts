import type {
  CompetitiveProfile,
  CompetitiveRoleProfile,
} from "@/lib/competitive/competitive-profile-types";
import {
  EMPTY_PROFILE_HERO_POOLS,
  type ProfileHeroPools,
  normalizeHeroPoolSelections,
  isHeroPoolRoleOption,
} from "@/lib/heroes/profile-hero-pools";
import type { ProfileFeaturedClip } from "@/lib/profiles/featured-clip-shared";
import type { ProfileBadge } from "@/lib/badges/badge-types";

import type { ProfilePageDto, RecentProfilePostDto } from "./types";

function isCompetitiveRole(value: unknown): value is "tank" | "dps" | "support" {
  return value === "tank" || value === "dps" || value === "support";
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

function normalizeFeaturedClips(value: unknown): ProfileFeaturedClip[] {
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
        candidate.platform !== "youtube" ||
        typeof candidate.position !== "number" ||
        typeof candidate.url !== "string"
      ) {
        return null;
      }

      return {
        id: candidate.id,
        platform: "youtube",
        position: candidate.position,
        thumbnailUrl:
          typeof candidate.thumbnailUrl === "string" ? candidate.thumbnailUrl : null,
        title: typeof candidate.title === "string" ? candidate.title : null,
        url: candidate.url,
      } satisfies ProfileFeaturedClip;
    })
    .filter((entry): entry is ProfileFeaturedClip => Boolean(entry));
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

function normalizeRecentPosts(value: unknown): RecentProfilePostDto[] {
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
        typeof candidate.lfgType !== "string" ||
        typeof candidate.title !== "string" ||
        typeof candidate.createdAt !== "string" ||
        !isCompetitiveRole(candidate.postingRole) ||
        typeof candidate.rankTier !== "string"
      ) {
        return null;
      }

      return {
        id: candidate.id,
        lfgType: candidate.lfgType,
        title: candidate.title,
        createdAt: candidate.createdAt,
        postingRole: candidate.postingRole,
        rankTier: candidate.rankTier,
        lookingForRoles: Array.isArray(candidate.lookingForRoles)
          ? candidate.lookingForRoles.filter((role): role is string => typeof role === "string")
          : [],
      } satisfies RecentProfilePostDto;
    })
    .filter((entry): entry is RecentProfilePostDto => Boolean(entry));
}

function createEmptyProfilePageDto(): ProfilePageDto {
  const emptyCompetitiveProfile: CompetitiveProfile = {
    profileId: "",
    mainRole: null,
    platform: null,
    roles: [],
  };

  return {
    viewer: {
      currentUserId: null,
      profileId: null,
      viewerState: "guest",
    },
    profile: null,
    heroPools: EMPTY_PROFILE_HERO_POOLS,
    competitiveProfile: emptyCompetitiveProfile,
    featuredClips: [],
    badges: [],
    recentPosts: [],
    relationship: {
      activeConnectionId: null,
      connectionCount: 0,
      initiallyBlockedByViewer: false,
      inviteState: "invite_to_play",
      pendingOutgoingInviteId: null,
    },
  };
}

export function normalizeProfilePageDto(value: unknown): ProfilePageDto {
  const emptyDto = createEmptyProfilePageDto();

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptyDto;
  }

  const candidate = value as Record<string, unknown>;
  const viewerRecord =
    candidate.viewer && typeof candidate.viewer === "object" && !Array.isArray(candidate.viewer)
      ? (candidate.viewer as Record<string, unknown>)
      : {};
  const profileRecord =
    candidate.profile && typeof candidate.profile === "object" && !Array.isArray(candidate.profile)
      ? (candidate.profile as Record<string, unknown>)
      : null;
  const competitiveProfileRecord =
    candidate.competitiveProfile &&
    typeof candidate.competitiveProfile === "object" &&
    !Array.isArray(candidate.competitiveProfile)
      ? (candidate.competitiveProfile as Record<string, unknown>)
      : null;
  const relationshipRecord =
    candidate.relationship &&
    typeof candidate.relationship === "object" &&
    !Array.isArray(candidate.relationship)
      ? (candidate.relationship as Record<string, unknown>)
      : {};

  return {
    viewer: {
      currentUserId:
        typeof viewerRecord.currentUserId === "string"
          ? viewerRecord.currentUserId
          : null,
      profileId:
        typeof viewerRecord.profileId === "string" ? viewerRecord.profileId : null,
      viewerState:
        viewerRecord.viewerState === "signed_in" ||
        viewerRecord.viewerState === "profile_required"
          ? viewerRecord.viewerState
          : "guest",
    },
    profile:
      profileRecord &&
      typeof profileRecord.id === "string" &&
      typeof profileRecord.username === "string"
        ? {
            id: profileRecord.id,
            username: profileRecord.username,
            displayName:
              typeof profileRecord.displayName === "string"
                ? profileRecord.displayName
                : null,
            discordUsername:
              typeof profileRecord.discordUsername === "string"
                ? profileRecord.discordUsername
                : null,
            discordAvatarUrl:
              typeof profileRecord.discordAvatarUrl === "string"
                ? profileRecord.discordAvatarUrl
                : null,
            avatarUrl:
              typeof profileRecord.avatarUrl === "string" ? profileRecord.avatarUrl : null,
            avatarUpdatedAt:
              typeof profileRecord.avatarUpdatedAt === "string"
                ? profileRecord.avatarUpdatedAt
                : null,
            coverImagePath:
              typeof profileRecord.coverImagePath === "string"
                ? profileRecord.coverImagePath
                : null,
            coverImageUpdatedAt:
              typeof profileRecord.coverImageUpdatedAt === "string"
                ? profileRecord.coverImageUpdatedAt
                : null,
            bio: typeof profileRecord.bio === "string" ? profileRecord.bio : null,
            timezone:
              typeof profileRecord.timezone === "string" ? profileRecord.timezone : null,
            region: typeof profileRecord.region === "string" ? profileRecord.region : null,
            currentRankTier:
              typeof profileRecord.currentRankTier === "string"
                ? profileRecord.currentRankTier
                : null,
            currentRankDivision:
              typeof profileRecord.currentRankDivision === "number"
                ? profileRecord.currentRankDivision
                : null,
            lookingFor: Array.isArray(profileRecord.lookingFor)
              ? profileRecord.lookingFor.filter((entry): entry is string => typeof entry === "string")
              : [],
            battlenetHandle:
              typeof profileRecord.battlenetHandle === "string"
                ? profileRecord.battlenetHandle
                : null,
            twitchUrl:
              typeof profileRecord.twitchUrl === "string" ? profileRecord.twitchUrl : null,
            xUrl: typeof profileRecord.xUrl === "string" ? profileRecord.xUrl : null,
            youtubeUrl:
              typeof profileRecord.youtubeUrl === "string" ? profileRecord.youtubeUrl : null,
            lastSeenAt:
              typeof profileRecord.lastSeenAt === "string" ? profileRecord.lastSeenAt : null,
            isLookingToPlay: profileRecord.isLookingToPlay === true,
            hideOfflinePresence: profileRecord.hideOfflinePresence === true,
          }
        : null,
    heroPools: normalizeHeroPools(candidate.heroPools),
    competitiveProfile: {
      profileId:
        competitiveProfileRecord && typeof competitiveProfileRecord.profileId === "string"
          ? competitiveProfileRecord.profileId
          : profileRecord && typeof profileRecord.id === "string"
            ? profileRecord.id
            : "",
      mainRole:
        competitiveProfileRecord && isCompetitiveRole(competitiveProfileRecord.mainRole)
          ? competitiveProfileRecord.mainRole
          : null,
      platform:
        competitiveProfileRecord && typeof competitiveProfileRecord.platform === "string"
          ? (competitiveProfileRecord.platform as CompetitiveProfile["platform"])
          : null,
      roles: normalizeRoleProfiles(
        competitiveProfileRecord ? competitiveProfileRecord.roles : null
      ),
    },
    featuredClips: normalizeFeaturedClips(candidate.featuredClips),
    badges: normalizeBadges(candidate.badges),
    recentPosts: normalizeRecentPosts(candidate.recentPosts),
    relationship: {
      activeConnectionId:
        typeof relationshipRecord.activeConnectionId === "string"
          ? relationshipRecord.activeConnectionId
          : null,
      connectionCount:
        typeof relationshipRecord.connectionCount === "number"
          ? relationshipRecord.connectionCount
          : 0,
      initiallyBlockedByViewer:
        relationshipRecord.initiallyBlockedByViewer === true,
      inviteState:
        relationshipRecord.inviteState === "connected" ||
        relationshipRecord.inviteState === "invite_sent"
          ? relationshipRecord.inviteState
          : "invite_to_play",
      pendingOutgoingInviteId:
        typeof relationshipRecord.pendingOutgoingInviteId === "string"
          ? relationshipRecord.pendingOutgoingInviteId
          : null,
    },
  };
}
