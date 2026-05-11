import { notFound } from "next/navigation";

import { getCompetitiveProfile } from "@/lib/competitive/competitive-profile";
import { getProfileHeroPools } from "@/lib/heroes/profile-hero-pools";
import { AuthMessage } from "@/app/login/components";
import { getProfileFeaturedClips } from "@/lib/profiles/profile-featured-clips";
import { getOptionalCurrentInviteViewer } from "@/lib/profiles/get-optional-current-invite-viewer";
import { getProfileByUsername } from "@/lib/profiles/get-profile-by-username";
import { getProfileAvatarUrl, getProfileCoverUrl } from "@/lib/profiles/profile-media";
import { getProfileBadges } from "@/lib/badges/badges";
import { getRecentPostsByProfileId } from "@/lib/lfg/posts";
import {
  getActiveConnectionIdForPair,
  getPendingOutgoingInviteIdForPair,
  getProfileConnectionCount,
  getProfileInviteState,
} from "@/lib/matches/play-invites";
import { getRankAccentStyle } from "@/lib/competitive/rank-border-styles";
import { EditableProfileHeader } from "./profile/editable-profile-header";
import {
  FeaturedClipsSection,
  type FeaturedClip,
} from "./profile/featured-clips";
import { PreferredHeroPools } from "./profile/preferred-hero-pools";
import { RecentProfilePosts } from "./profile/recent-profile-posts";
import { getCompetitiveRankDisplay } from "./profile/profile-rank";

type ProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function measureProfileStep<T>(
  username: string,
  label: string,
  load: () => Promise<T>
) {
  if (process.env.NODE_ENV === "production") {
    return load();
  }

  const startTime = performance.now();

  try {
    return await load();
  } finally {
    const duration = Math.round(performance.now() - startTime);
    console.log(`[profile:${username}] ${label}: ${duration}ms`);
  }
}

export default async function ProfilePage({
    params,
    searchParams,
}: ProfilePageProps) {
    const { username } = await params;
    const query = searchParams ? await searchParams : {};
    const message = pickValue(query.message);
    const messageType = pickValue(query.type);
    const [profile, viewer] = await Promise.all([
        measureProfileStep(username, "public profile", () =>
            getProfileByUsername(username)
        ),
        measureProfileStep(username, "optional invite viewer", () =>
            getOptionalCurrentInviteViewer()
        ),
    ]);

    if (!profile) {
        notFound();
    }

    const [heroPools, competitiveProfile, featuredClips, badges, recentPosts, inviteState, connectionCount, activeConnectionId, pendingOutgoingInviteId] =
        await Promise.all([
            measureProfileStep(username, "hero pools", () =>
                getProfileHeroPools(profile.id)
            ),
            measureProfileStep(username, "competitive profile", () =>
                getCompetitiveProfile(profile.id)
            ),
            measureProfileStep(username, "featured clips", () =>
                getProfileFeaturedClips(profile.id)
            ),
            measureProfileStep(username, "badges", () =>
                getProfileBadges(profile.id)
            ),
            measureProfileStep(username, "recent posts", () =>
                getRecentPostsByProfileId(profile.id)
            ),
            measureProfileStep(username, "invite state", () =>
                getProfileInviteState({
                    currentProfileId: viewer.profileId,
                    targetProfileId: profile.id,
                })
            ),
            measureProfileStep(username, "connection count", () =>
                getProfileConnectionCount(profile.id)
            ),
            measureProfileStep(username, "active connection id", () =>
                getActiveConnectionIdForPair({
                    currentProfileId: viewer.profileId,
                    targetProfileId: profile.id,
                })
            ),
            measureProfileStep(username, "pending outgoing invite id", () =>
                getPendingOutgoingInviteIdForPair({
                    currentProfileId: viewer.profileId,
                    targetProfileId: profile.id,
                })
            ),
        ]);

    // Keep route components focused on loading data while profile presentation
    // helpers stay colocated with the UI they support.
    const { currentRank, currentRankIconSrc } =
        getCompetitiveRankDisplay(profile, competitiveProfile);
    const isOwner = viewer.currentUserId === profile.id;
    const mainRoleProfile = competitiveProfile.roles.find(
        (roleProfile) => roleProfile.role === competitiveProfile.mainRole
    );
    const profileRankTier =
        mainRoleProfile?.rankTier ?? profile.current_rank_tier;
    const profileAccentStyle = getRankAccentStyle(profileRankTier);
    const coverImageUrl = getProfileCoverUrl(
        profile.cover_image_path,
        profile.cover_image_updated_at
    );
    const socialLinks = [
        profile.twitch_url
            ? {
                  label: "Twitch",
                  platform: "twitch" as const,
                  value: profile.twitch_url,
              }
            : null,
        profile.x_url
            ? {
                  label: "X",
                  platform: "x" as const,
                  value: profile.x_url,
              }
            : null,
        profile.youtube_url
            ? {
                  label: "YouTube",
                  platform: "youtube" as const,
                  value: profile.youtube_url,
              }
            : null,
    ].filter((link): link is NonNullable<typeof link> => Boolean(link));

    return (
        <main className="relative flex-1 bg-transparent px-4 py-4 text-[15px] text-zinc-100 sm:px-6 sm:py-5">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_44%)]"
            />
            <div className="relative z-10 mx-auto grid w-full max-w-4xl gap-2.5">
                {isOwner ? (
                    <AuthMessage message={message} type={messageType} />
                ) : null}
                <div
                    className="oc-profile-shell rounded-[12px] bg-[var(--profile-rank-border)] p-px shadow-none"
                    style={profileAccentStyle}
                >
                    <div
                        className="overflow-hidden rounded-[11px] bg-[#090909]"
                        style={profileAccentStyle}
                    >
                        <EditableProfileHeader
                            avatarUrl={getProfileAvatarUrl(
                                profile.avatar_url ?? null,
                                profile.avatar_updated_at ?? null
                            )}
                            bio={profile.bio}
                            badges={badges}
                            connectionCount={connectionCount}
                            coverImageUrl={coverImageUrl}
                            currentRank={currentRank}
                            currentRankTier={profileRankTier}
                            currentRankIconSrc={currentRankIconSrc}
                            displayName={profile.display_name}
                            hideOfflinePresence={profile.hide_offline_presence}
                            id={profile.id}
                            isOwner={isOwner}
                            isLookingToPlay={profile.is_looking_to_play}
                            lastSeenAt={profile.last_seen_at}
                            lookingFor={profile.looking_for}
                            platform={competitiveProfile.platform}
                            region={profile.region}
                            socialLinks={socialLinks}
                            timezone={profile.timezone}
                            username={profile.username}
                            activeConnectionId={activeConnectionId}
                            pendingOutgoingInviteId={pendingOutgoingInviteId}
                            profileActionState={inviteState}
                            viewerState={viewer.viewerState}
                        />
                        <PreferredHeroPools
                            competitiveProfile={competitiveProfile}
                            heroPicks={heroPools.heroPicks}
                            isOwner={isOwner}
                            roles={heroPools.roles}
                        />
                        <FeaturedClipsSection
                            clips={featuredClips as FeaturedClip[]}
                            isOwner={isOwner}
                        />
                        <RecentProfilePosts
                            isOwner={isOwner}
                            posts={recentPosts}
                            profileUsername={profile.username}
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}
