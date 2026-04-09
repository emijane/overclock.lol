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
        </section>
      </div>
    </main>
  );
}
