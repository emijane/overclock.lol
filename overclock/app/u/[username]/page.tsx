import { notFound } from "next/navigation";

import { getCompetitiveProfile } from "@/lib/competitive/competitive-profile";
import { getProfileHeroPools } from "@/lib/heroes/profile-hero-pools";
import { AuthMessage } from "@/app/login/components";
import { getProfileFeaturedClips } from "@/lib/profiles/profile-featured-clips";
import { getOptionalCurrentUserId } from "@/lib/profiles/get-optional-current-user-id";
import { getProfileByUsername } from "@/lib/profiles/get-profile-by-username";
import { getProfileCoverUrl } from "@/lib/profiles/profile-media";
import { getProfileBadges } from "@/lib/badges/badges";
import { getRecentPostsByProfileId } from "@/lib/lfg/posts";
import { EditableProfileHeader } from "./profile/editable-profile-header";
import {
  FeaturedClipsSection,
  type FeaturedClip,
} from "./profile/featured-clips";
import { PreferredHeroPools } from "./profile/preferred-hero-pools";
import { RecentProfilePosts } from "./profile/recent-profile-posts";
import {
  getRankAccentStyle,
  getRankBorderClassName,
} from "./profile/rank-border-styles";
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
    const [profile, currentUserId] = await Promise.all([
        measureProfileStep(username, "public profile", () =>
            getProfileByUsername(username)
        ),
        measureProfileStep(username, "optional current user id", () =>
            getOptionalCurrentUserId()
        ),
    ]);

    if (!profile) {
        notFound();
    }

    const [heroPools, competitiveProfile, featuredClips, badges, recentPosts] =
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
        ]);

    // Keep route components focused on loading data while profile presentation
    // helpers stay colocated with the UI they support.
    const { currentRank, currentRankIconSrc, currentRankPill } =
        getCompetitiveRankDisplay(profile, competitiveProfile);
    const roleLabels = heroPools.roles.map((role) =>
        role === "tank" ? "Tank" : role === "dps" ? "DPS" : "Support"
    );
    const isOwner = currentUserId === profile.id;
    const mainRoleProfile = competitiveProfile.roles.find(
        (roleProfile) => roleProfile.role === competitiveProfile.mainRole
    );
    const profileRankTier =
        mainRoleProfile?.rankTier ?? profile.current_rank_tier;
    const profileAccentStyle = getRankAccentStyle(profileRankTier);
    const profileBorderClassName = getRankBorderClassName(profileRankTier);
    const coverImageUrl = getProfileCoverUrl(
        profile.cover_image_path,
        profile.cover_image_updated_at
    );
    const socialLinks = [
        profile.discord_username
            ? {
                  label: "Discord",
                  platform: "discord" as const,
                  value: `@${profile.discord_username}`,
              }
            : null,
        profile.battlenet_handle
            ? {
                  label: "Battle.net",
                  platform: "battlenet" as const,
                  value: profile.battlenet_handle,
              }
            : null,
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
        <main className="min-h-screen bg-transparent px-4 py-5 text-[15px] text-zinc-100 sm:px-6 sm:py-7">
            <div className="mx-auto grid w-full max-w-4xl gap-3">
                {isOwner ? (
                    <AuthMessage message={message} type={messageType} />
                ) : null}
                <div className={`rounded-[28px] p-px ${profileBorderClassName}`}>
                    <div
                        className="overflow-hidden rounded-[27px] bg-zinc-950"
                        style={profileAccentStyle}
                    >
                        <EditableProfileHeader
                            avatarUrl={profile.discord_avatar_url}
                            bio={profile.bio}
                            badges={badges}
                            coverImageUrl={coverImageUrl}
                            currentRank={currentRank}
                            currentRankTier={profileRankTier}
                            currentRankIconSrc={currentRankIconSrc}
                            currentRankPill={currentRankPill}
                            displayName={profile.display_name}
                            isOwner={isOwner}
                            lookingFor={profile.looking_for}
                            platform={profile.platform}
                            region={profile.region}
                            roleLabels={roleLabels}
                            socialLinks={socialLinks}
                            timezone={profile.timezone}
                            username={profile.username}
                        />
                        <FeaturedClipsSection
                            clips={featuredClips as FeaturedClip[]}
                            isOwner={isOwner}
                        />
                        <PreferredHeroPools
                            competitiveProfile={competitiveProfile}
                            heroPicks={heroPools.heroPicks}
                            isOwner={isOwner}
                            roles={heroPools.roles}
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
