import { notFound } from "next/navigation";

import { getProfileByUsername } from "@/lib/profiles/get-profile-by-username";
import { getRankIconSrc } from "./profile/rank-icons";
import { ProfileHeader } from "./profile/profile-header";

type ProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  const currentRank =
    profile.current_rank_tier && profile.current_rank_tier !== "Unranked"
      ? `${profile.current_rank_tier} ${profile.current_rank_division ?? ""}`.trim()
      : profile.current_rank_tier;
  const currentRankPill = currentRank ?? "Unranked";
  const currentRankIconSrc = getRankIconSrc(profile.current_rank_tier);

  return (
    <main className="min-h-screen bg-[#f9f9f9] px-5 py-7 text-[15px] text-[#111827]">
      <div className="mx-auto w-full max-w-6xl">
        <ProfileHeader
          avatarUrl={profile.discord_avatar_url}
          battleNet="Player#1234"
          bio={profile.bio}
          currentRank={currentRank}
          currentRankIconSrc={currentRankIconSrc}
          currentRankPill={currentRankPill}
          displayName={profile.display_name}
          discordUsername={profile.discord_username}
          platform={profile.platform}
          region={profile.region}
          timezone={profile.timezone}
          username={profile.username}
        />
      </div>
    </main>
  );
}
