import { notFound } from "next/navigation";

import { getProfileHeroPools } from "@/lib/heroes/profile-hero-pools";
import { AuthMessage } from "@/app/login/components";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";
import { getProfileByUsername } from "@/lib/profiles/get-profile-by-username";
import { getProfileCoverUrl } from "@/lib/profiles/profile-media";
import { PreferredHeroPools } from "./profile/preferred-hero-pools";
import { ProfileHeader } from "./profile/profile-header";
import { getCurrentRankDisplay } from "./profile/profile-rank";

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
  const profile = await getProfileByUsername(username);
  const { profile: currentProfile } = await getCurrentProfile();

  if (!profile) {
    notFound();
  }

  const heroPools = await getProfileHeroPools(profile.id);

  // Keep route components focused on loading data while profile presentation
  // helpers stay colocated with the UI they support.
  const { currentRank, currentRankIconSrc, currentRankPill } =
    getCurrentRankDisplay(profile);
  const roleLabels = heroPools.roles.map((role) =>
    role === "tank" ? "Tank" : role === "dps" ? "DPS" : "Support"
  );
  const isOwner = currentProfile?.id === profile.id;
  const coverImageUrl = getProfileCoverUrl(
    profile.cover_image_path,
    profile.cover_image_updated_at
  );
  const socialLinks = [
    {
      label: "Discord",
      platform: "discord" as const,
      value: profile.discord_username
        ? `@${profile.discord_username}`
        : "@discord-user",
    },
    {
      label: "Battle.net",
      platform: "battlenet" as const,
      value: "Player#1234",
    },
    {
      label: "Twitch",
      platform: "twitch" as const,
      value: "twitch.tv/username",
    },
    {
      label: "X",
      platform: "x" as const,
      value: "@username",
    },
    {
      label: "YouTube",
      platform: "youtube" as const,
      value: "youtube.com/@channel",
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-[15px] text-zinc-100 sm:px-6 sm:py-7">
      <div className="mx-auto grid w-full max-w-4xl gap-4">
        {isOwner ? <AuthMessage message={message} type={messageType} /> : null}
        <ProfileHeader
          avatarUrl={profile.discord_avatar_url}
          bio={profile.bio}
          coverImageUrl={coverImageUrl}
          currentRank={currentRank}
          currentRankIconSrc={currentRankIconSrc}
          currentRankPill={currentRankPill}
          displayName={profile.display_name}
          isOwner={isOwner}
          platform={profile.platform}
          region={profile.region}
          roleLabels={roleLabels}
          socialLinks={socialLinks}
          timezone={profile.timezone}
          username={profile.username}
        />
        <PreferredHeroPools
          heroPicks={heroPools.heroPicks}
          roles={heroPools.roles}
        />
      </div>
    </main>
  );
}
