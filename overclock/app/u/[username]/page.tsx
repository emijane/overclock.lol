import { notFound } from "next/navigation";

import { getProfileByUsername } from "@/lib/profiles/get-profile-by-username";
import { ProfileHeader } from "./profile/profile-header";
import { getCurrentRankDisplay } from "./profile/profile-rank";

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

  // Keep route components focused on loading data while profile presentation
  // helpers stay colocated with the UI they support.
  const { currentRank, currentRankIconSrc, currentRankPill } =
    getCurrentRankDisplay(profile);

  return (
    <main className="min-h-screen bg-[#f9f9f9] px-4 py-5 text-[15px] text-[#111827] sm:px-6 sm:py-7">
      <div className="mx-auto w-full max-w-4xl">
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
