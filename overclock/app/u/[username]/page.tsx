import { notFound } from "next/navigation";

import { getProfileByUsername } from "@/lib/profiles/get-profile-by-username";
import { getRankIconSrc } from "./profile/rank-icons";
import { IntroCard, type IntroGroup, type IntroItem } from "./profile/intro-card";
import { ProfileHeader } from "./profile/profile-header";

type ProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

function compactItems(items: Array<IntroItem | null>) {
  return items.filter((item): item is IntroItem => Boolean(item));
}

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
  const detailGroups: IntroGroup[] = [
    {
      heading: "Play",
      items: compactItems([
        profile.region ? { label: "Region", value: profile.region } : null,
        profile.platform ? { label: "Platform", value: profile.platform } : null,
        profile.timezone ? { label: "Timezone", value: profile.timezone } : null,
      ]),
    },
    {
      heading: "Contact",
      items: compactItems([
        profile.discord_username
          ? { label: "Discord", value: `@${profile.discord_username}` }
          : null,
        { label: "Battle.net", value: "Player#1234" },
      ]),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <main className="min-h-screen bg-[#f9f9f9] px-5 py-7 text-[15px] text-[#111827]">
      <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <ProfileHeader
          avatarUrl={profile.discord_avatar_url}
          bio={profile.bio}
          currentRank={currentRank}
          currentRankIconSrc={currentRankIconSrc}
          currentRankPill={currentRankPill}
          displayName={profile.display_name}
          username={profile.username}
        />
        <IntroCard groups={detailGroups} />
      </div>
    </main>
  );
}
