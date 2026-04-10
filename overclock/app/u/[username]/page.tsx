import { notFound } from "next/navigation";

import { getProfileByUsername } from "@/lib/profiles/get-profile-by-username";
import { getRankIconSrc } from "./profile/rank-icons";
import { IntroCard } from "./profile/intro-card";
import { PreferredHeroPools } from "./profile/preferred-hero-pools";
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
  const introItems = [
    profile.region ? { label: "Region", value: profile.region } : null,
    profile.platform ? { label: "Platform", value: profile.platform } : null,
    profile.timezone ? { label: "Timezone", value: profile.timezone } : null,
    currentRank ? { label: "Rank", value: currentRank } : null,
    profile.uses_mic ? { label: "Comms", value: "Uses mic" } : null,
    profile.discord_username
      ? { label: "Discord", value: `@${profile.discord_username}` }
      : null,
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact));

  return (
    <main className="min-h-screen bg-black px-5 py-7 text-[15px] text-zinc-100">
      <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <ProfileHeader
          avatarUrl={profile.discord_avatar_url}
          bio={profile.bio}
          currentRank={currentRank}
          currentRankIconSrc={currentRankIconSrc}
          currentRankPill={currentRankPill}
          displayName={profile.display_name}
          username={profile.username}
        />
        <IntroCard items={introItems} />
        <PreferredHeroPools />
      </div>
    </main>
  );
}
