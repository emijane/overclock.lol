import type { ProfileBadge } from "@/lib/badges/badge-types";
import type {
  CompetitiveProfile,
  CompetitiveRoleProfile,
} from "@/lib/competitive/competitive-profile-types";
import type { InviteViewerState, ProfileInviteState } from "@/lib/matches/play-invite-types";
import type { ProfileFeaturedClip } from "@/lib/profiles/featured-clip-shared";
import type { ProfileHeroPools } from "@/lib/heroes/profile-hero-pools";

export type RecentProfilePostDto = {
  createdAt: string;
  id: string;
  lfgType: string;
  lookingForRoles: string[];
  postingRole: "tank" | "dps" | "support";
  rankTier: string;
  title: string;
};

export type ProfilePageDto = {
  badges: ProfileBadge[];
  competitiveProfile: CompetitiveProfile;
  featuredClips: ProfileFeaturedClip[];
  heroPools: ProfileHeroPools;
  profile: {
    avatarUpdatedAt: string | null;
    avatarUrl: string | null;
    battlenetHandle: string | null;
    bio: string | null;
    coverImagePath: string | null;
    coverImageUpdatedAt: string | null;
    currentRankDivision: number | null;
    currentRankTier: string | null;
    discordAvatarUrl: string | null;
    discordUsername: string | null;
    displayName: string | null;
    hideOfflinePresence: boolean;
    id: string;
    isLookingToPlay: boolean;
    lastSeenAt: string | null;
    lookingFor: string[];
    region: string | null;
    timezone: string | null;
    twitchUrl: string | null;
    username: string;
    xUrl: string | null;
    youtubeUrl: string | null;
  } | null;
  recentPosts: RecentProfilePostDto[];
  relationship: {
    activeConnectionId: string | null;
    connectionCount: number;
    initiallyBlockedByViewer: boolean;
    inviteState: ProfileInviteState;
    pendingOutgoingInviteId: string | null;
  };
  viewer: {
    currentUserId: string | null;
    profileId: string | null;
    viewerState: InviteViewerState;
  };
};

export type { CompetitiveRoleProfile };
