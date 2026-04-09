import { redirect } from "next/navigation";

import { signOut } from "@/app/auth/actions";
import { createProfile } from "@/app/onboarding/actions";
import { AuthMessage } from "@/app/login/components";
import { getDiscordProfile } from "@/lib/profiles/discord-profile";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

type OnboardingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// New Discord-authenticated users land here until they create an app profile.
// Once a profile exists, we keep them out of onboarding and send them back to
// the authenticated flow.
export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const params = searchParams ? await searchParams : {};
  const message = pickValue(params.message);
  const messageType = pickValue(params.type);
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (profile) {
    redirect("/login");
  }

  const discordProfile = getDiscordProfile(user);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-xl items-center">
        <section className="w-full rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
          <AuthMessage message={message} type={messageType} />
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-300">
            Onboarding
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Finish setting up your profile
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Your account is authenticated with Discord. Next we will collect
            your unique username and create your app profile.
          </p>
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-400">
              Discord account
            </p>
            <div className="mt-4 flex items-center gap-4">
              {discordProfile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={discordProfile.avatarUrl}
                  alt={`${discordProfile.displayName} avatar`}
                  className="h-16 w-16 rounded-full border border-slate-700 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-lg font-semibold text-slate-200">
                  {discordProfile.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-white">
                  {discordProfile.displayName}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  @{discordProfile.discordUsername || "discord-user"}
                </p>
              </div>
            </div>
          </div>

          <form action={createProfile} className="mt-6 grid gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Choose your username
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                This will become your unique profile URL and public app handle.
              </p>
            </div>

            <label className="grid gap-2 text-sm text-slate-300">
              Username
              <input
                required
                name="username"
                type="text"
                placeholder="sleepyana"
                minLength={3}
                maxLength={24}
                pattern="[a-z0-9_]+"
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-400"
              />
            </label>

            <label className="grid gap-2 text-sm text-slate-300">
              Display name
              <input
                required
                name="display_name"
                type="text"
                defaultValue={discordProfile.displayName}
                maxLength={40}
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-400"
              />
            </label>

            <button
              type="submit"
              className="rounded-full bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
            >
              Save profile
            </button>
          </form>

          <div className="mt-6">
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Sign out
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
