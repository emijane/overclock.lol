import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

function formatRank(
  tier: string | null | undefined,
  division: number | null | undefined
) {
  if (!tier) {
    return "Not set";
  }

  if (tier === "Unranked") {
    return "Unranked";
  }

  return `${tier} ${division ?? ""}`.trim();
}

export default async function AccountPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-300">
            Account
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Profile settings
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            This page will become the editing surface for your Overwatch profile.
            For now, it shows the current stored values so we can confirm the
            route and data are wired correctly before adding updates.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Username
              </p>
              <p className="mt-2 text-sm font-medium text-slate-100">
                @{profile.username}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Display name
              </p>
              <p className="mt-2 text-sm font-medium text-slate-100">
                {profile.display_name}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Region
              </p>
              <p className="mt-2 text-sm font-medium text-slate-100">
                {profile.region ?? "Not set"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Platform
              </p>
              <p className="mt-2 text-sm font-medium text-slate-100">
                {profile.platform ?? "Not set"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Timezone
              </p>
              <p className="mt-2 text-sm font-medium text-slate-100">
                {profile.timezone ?? "Not set"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Uses mic
              </p>
              <p className="mt-2 text-sm font-medium text-slate-100">
                {profile.uses_mic ? "Yes" : "No"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Current rank
              </p>
              <p className="mt-2 text-sm font-medium text-slate-100">
                {formatRank(
                  profile.current_rank_tier,
                  profile.current_rank_division
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Peak rank
              </p>
              <p className="mt-2 text-sm font-medium text-slate-100">
                {formatRank(profile.peak_rank_tier, profile.peak_rank_division)}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Looking for
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.looking_for && profile.looking_for.length > 0 ? (
                profile.looking_for.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-sky-200"
                  >
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-400">Not set</span>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Bio
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {profile.bio ?? "No bio added yet."}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
