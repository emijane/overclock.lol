import { notFound } from "next/navigation";

import { getProfileByUsername } from "@/lib/profiles/get-profile-by-username";

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
  const peakRank =
    profile.peak_rank_tier && profile.peak_rank_tier !== "Unranked"
      ? `${profile.peak_rank_tier} ${profile.peak_rank_division ?? ""}`.trim()
      : profile.peak_rank_tier;
  const competitiveFacts = [
    currentRank ? { label: "Current rank", value: currentRank } : null,
    peakRank ? { label: "Peak rank", value: peakRank } : null,
    profile.uses_mic ? { label: "Comms", value: "Uses mic" } : null,
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact));
  const logisticsFacts = [
    profile.region ? { label: "Region", value: profile.region } : null,
    profile.platform ? { label: "Platform", value: profile.platform } : null,
    profile.timezone ? { label: "Timezone", value: profile.timezone } : null,
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact));

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-3xl items-center">
        <section className="w-full rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {profile.discord_avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.discord_avatar_url}
                alt={`${profile.display_name} avatar`}
                className="h-24 w-24 rounded-full border border-slate-700 object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-3xl font-semibold text-slate-200">
                {profile.display_name.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-300">
                Player Profile
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                {profile.display_name}
              </h1>
              <p className="mt-2 text-sm text-slate-400">@{profile.username}</p>
              {profile.discord_username ? (
                <p className="mt-1 text-sm text-slate-500">
                  Discord: @{profile.discord_username}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-400">
              About
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {profile.bio || "This player has not added a bio yet."}
            </p>
          </div>

          {competitiveFacts.length > 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-400">
                Competitive Profile
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {competitiveFacts.map((fact) => (
                  <div
                    key={fact.label}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {fact.label}
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-100">
                      {fact.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {logisticsFacts.length > 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-400">
                Queue Details
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {logisticsFacts.map((fact) => (
                  <div
                    key={fact.label}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {fact.label}
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-100">
                      {fact.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {profile.looking_for && profile.looking_for.length > 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-400">
                Looking For
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.looking_for.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-sky-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
