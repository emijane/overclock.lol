import Image from "next/image";
import { notFound } from "next/navigation";

import { getProfileByUsername } from "@/lib/profiles/get-profile-by-username";

type ProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

const rankIconSrcByTier = {
  Bronze: "/ranks/9 Bronze.png",
  Silver: "/ranks/8 Silver.png",
  Gold: "/ranks/7 Gold.png",
  Platinum: "/ranks/6 Platinum.png",
  Diamond: "/ranks/5 Diamond.png",
  Master: "/ranks/4 Masters.png",
  Grandmaster: "/ranks/3 Grandmaster.png",
  Champion: "/ranks/2 Champion.png",
  "Top 500": "/ranks/1 Top 500.png",
} as const;

function getRankIconSrc(tier: string | null) {
  if (!tier || tier === "Unranked") {
    return null;
  }

  return rankIconSrcByTier[tier as keyof typeof rankIconSrcByTier] ?? null;
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
    <main className="min-h-screen bg-black px-6 py-10 text-zinc-100">
      <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950">
          <div className="h-36 bg-[radial-gradient(circle_at_20%_20%,rgba(212,212,216,0.18),transparent_32%),linear-gradient(135deg,#18181b,#09090b)]" />
          <div className="px-6 pb-7">
            <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                {profile.discord_avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.discord_avatar_url}
                    alt={`${profile.display_name} avatar`}
                    className="h-28 w-28 rounded-full border-4 border-black object-cover shadow-xl shadow-black/40"
                  />
                ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-black bg-zinc-900 text-4xl font-semibold text-zinc-200 shadow-xl shadow-black/40">
                    {profile.display_name.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-14 sm:pt-16">
                <button
                  type="button"
                  className="rounded-full border border-zinc-700 px-5 py-2 text-sm font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-900"
                >
                  Message
                </button>
                <button
                  type="button"
                  className="rounded-full bg-zinc-100 px-5 py-2 text-sm font-semibold text-black transition hover:bg-white"
                >
                  Follow
                </button>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  {profile.display_name}
                </h1>
                {currentRankIconSrc && currentRank ? (
                  <Image
                    src={currentRankIconSrc}
                    alt={`${currentRank} rank icon`}
                    width={44}
                    height={44}
                    className="h-7 w-7 object-contain"
                  />
                ) : null}
              </div>
              <p className="mt-1 text-sm text-zinc-400">@{profile.username}</p>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-300">
                {profile.bio || "This player has not added a bio yet."}
              </p>
            </div>

            {profile.looking_for && profile.looking_for.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {profile.looking_for.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <aside className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-sm font-semibold text-white">Intro</h2>
          <div className="mt-5 grid gap-4">
            {introItems.length > 0 ? (
              introItems.map((item) => (
                <div key={item.label} className="flex items-center gap-3 text-sm">
                  <span className="h-2 w-2 rounded-full bg-zinc-300" />
                  <span className="text-zinc-400">{item.label}</span>
                  <span className="ml-auto font-medium text-zinc-100">
                    {item.value}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-400">
                No profile details added yet.
              </p>
            )}
          </div>
        </aside>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-white">Heroes</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            Hero pools are coming soon. This section will show mains, flex
            heroes, and role-specific picks.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {["Mains", "Flex picks", "Learning"].map((label) => (
              <div
                key={label}
                className="rounded-2xl border border-zinc-800 bg-black p-4"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {label}
                </p>
                <p className="mt-3 text-sm text-zinc-400">Not set yet</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
