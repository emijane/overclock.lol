import { notFound } from "next/navigation";

import { AuthenticatedWorkspaceShell } from "@/components/app-shell/authenticated-workspace-shell";
import { PageReveal } from "@/components/app-shell/page-reveal";
import { AuthMessage } from "@/features/auth/components";
import { RecentProfilePosts } from "@/features/profile/components/recent-profile-posts";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";
import { getProfileAvatarUrl, getProfileCoverUrl } from "@/lib/profiles/profile-media";
import { getProfilePageDto } from "@/lib/pages/profile-page-dto";
import { getRankAccentStyle } from "@/lib/competitive/rank-border-styles";
import { resolveMainRole } from "@/lib/competitive/competitive-profile-types";
import { EditableProfileHeader } from "./profile/editable-profile-header";
import {
  FeaturedClipsSection,
  type FeaturedClip,
} from "./profile/featured-clips";
import { PreferredHeroPools } from "./profile/preferred-hero-pools";
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

export default async function ProfilePage({
    params,
    searchParams,
}: ProfilePageProps) {
    const { username } = await params;
    const query = searchParams ? await searchParams : {};
    const message = pickValue(query.message);
    const messageType = pickValue(query.type);
    const { profile: currentProfile } = await getCurrentProfile();
    const dto = await getProfilePageDto(username, currentProfile?.id ?? null);
    const profile = dto.profile;

    if (!profile) {
        notFound();
    }
    const viewer = dto.viewer;
    const heroPools = dto.heroPools;
    const competitiveProfile = dto.competitiveProfile;
    const featuredClips = dto.featuredClips;
    const badges = dto.badges;
    const recentPosts = dto.recentPosts;
    const inviteState = dto.relationship.inviteState;
    const connectionCount = dto.relationship.connectionCount;
    const activeConnectionId = dto.relationship.activeConnectionId;
    const pendingOutgoingInviteId = dto.relationship.pendingOutgoingInviteId;
    const initiallyBlockedByViewer = dto.relationship.initiallyBlockedByViewer;

    // Keep route components focused on loading data while profile presentation
    // helpers stay colocated with the UI they support.
    const { currentRank, currentRankIconSrc } =
        getCompetitiveRankDisplay(
            {
                current_rank_division: profile.currentRankDivision,
                current_rank_tier: profile.currentRankTier,
            },
            competitiveProfile
        );
    const isOwner = viewer.currentUserId === profile.id;
    const mainRoleProfile = competitiveProfile.roles.find(
        (roleProfile) => roleProfile.role === resolveMainRole(competitiveProfile)
    );
    const profileRankTier =
        mainRoleProfile?.rankTier ?? profile.currentRankTier;
    const displayName = profile.displayName ?? profile.username;
    const profileAccentStyle = getRankAccentStyle(profileRankTier);
    const coverImageUrl = getProfileCoverUrl(
        profile.coverImagePath,
        profile.coverImageUpdatedAt
    );
    const socialLinks = [
        profile.twitchUrl
            ? {
                  label: "Twitch",
                  platform: "twitch" as const,
                  value: profile.twitchUrl,
              }
            : null,
        profile.xUrl
            ? {
                  label: "X",
                  platform: "x" as const,
                  value: profile.xUrl,
              }
            : null,
        profile.youtubeUrl
            ? {
                  label: "YouTube",
                  platform: "youtube" as const,
                  value: profile.youtubeUrl,
              }
            : null,
    ].filter((link): link is NonNullable<typeof link> => Boolean(link));

    return (
        <AuthenticatedWorkspaceShell centerClassName="w-full max-w-4xl">
            <PageReveal variant="fade">
                <div className="grid w-full gap-2.5">
                    {isOwner ? (
                        <AuthMessage message={message} type={messageType} />
                    ) : null}
                    <div
                        className="oc-profile-rank-shell flex flex-1 flex-col overflow-clip rounded-[16px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.018)_0%,rgba(255,255,255,0.008)_28%,rgba(7,7,9,0.96)_100%)] sm:rounded-[10px] sm:border-0 sm:bg-[linear-gradient(180deg,rgba(255,255,255,0.012)_0%,rgba(255,255,255,0.006)_100%)]"
                        style={{
                            ...profileAccentStyle,
                            borderColor: "var(--profile-rank-border)",
                        }}
                    >
                        <div
                            className="flex w-full min-w-0 flex-1 flex-col overflow-hidden bg-transparent sm:rounded-[10px]"
                            style={profileAccentStyle}
                        >
                            <EditableProfileHeader
                                avatarUrl={getProfileAvatarUrl(
                                    profile.avatarUrl ?? null,
                                    profile.avatarUpdatedAt ?? null
                                )}
                                bio={profile.bio}
                                badges={badges}
                                connectionCount={connectionCount}
                                coverImageUrl={coverImageUrl}
                                createdAt={profile.createdAt}
                                currentRank={currentRank}
                                currentRankTier={profileRankTier}
                                currentRankIconSrc={currentRankIconSrc}
                                currentViewerProfileId={viewer.profileId}
                                displayName={displayName}
                                hideOfflinePresence={profile.hideOfflinePresence}
                                id={profile.id}
                                initiallyBlockedByViewer={initiallyBlockedByViewer}
                                isOwner={isOwner}
                                isLookingToPlay={profile.isLookingToPlay}
                                lastSeenAt={profile.lastSeenAt}
                                lookingFor={profile.lookingFor}
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
                                rankTier={profileRankTier}
                            />
                            <RecentProfilePosts
                                isOwner={isOwner}
                                posts={recentPosts}
                                profileUsername={profile.username}
                                rankTier={profileRankTier}
                            />
                        </div>
                    </div>
                </div>
            </PageReveal>
        </AuthenticatedWorkspaceShell>
    );
}
