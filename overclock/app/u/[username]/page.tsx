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
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80">
          <div className="h-36 bg-[radial-gradient(circle_at_20%_20%,_rgba(14,165,233,0.35),_transparent_32%),linear-gradient(135deg,_rgba(15,23,42,1),_rgba(30,41,59,0.95))]" />
          <div className="px-6 pb-7">
            <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                {profile.discord_avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.discord_avatar_url}
                    alt={`${profile.display_name} avatar`}
                    className="h-28 w-28 rounded-full border-4 border-slate-900 object-cover shadow-xl shadow-black/30"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-slate-900 bg-slate-800 text-4xl font-semibold text-slate-200 shadow-xl shadow-black/30">
                    {profile.display_name.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-14 sm:pt-16">
                <button
                  type="button"
                  className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-white transition hover:border-sky-400 hover:text-sky-200"
                >
                  Message
                </button>
                <button
                  type="button"
                  className="rounded-full bg-sky-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
                >
                  Follow
                </button>
              </div>
            </div>

            <div className="mt-5">
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                {profile.display_name}
              </h1>
              <p className="mt-1 text-sm text-slate-400">@{profile.username}</p>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">
                {profile.bio || "This player has not added a bio yet."}
              </p>
            </div>

            {profile.looking_for && profile.looking_for.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {profile.looking_for.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-sky-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="text-sm font-semibold text-white">Intro</h2>
          <div className="mt-5 grid gap-4">
            {introItems.length > 0 ? (
              introItems.map((item) => (
                <div key={item.label} className="flex items-center gap-3 text-sm">
                  <span className="h-2 w-2 rounded-full bg-sky-300" />
                  <span className="text-slate-400">{item.label}</span>
                  <span className="ml-auto font-medium text-slate-100">
                    {item.value}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">
                No profile details added yet.
              </p>
            )}
          </div>
        </aside>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-white">Heroes</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Hero pools are coming soon. This section will show mains, flex
            heroes, and role-specific picks.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {["Mains", "Flex picks", "Learning"].map((label) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {label}
                </p>
                <p className="mt-3 text-sm text-slate-400">Not set yet</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
