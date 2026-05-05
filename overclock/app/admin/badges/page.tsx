import { notFound, redirect } from "next/navigation";

import { PageContainer } from "@/app/components/page-container";
import { AuthMessage } from "@/app/login/components";
import { assignBadgeToUsername, removeBadgeFromUsername } from "@/app/admin/badges/actions";
import { canAccessAdmin } from "@/lib/admin/admin-access";
import { getBadgeDefinitions, getProfileBadges } from "@/lib/badges/badges";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";
import { getProfileByUsername } from "@/lib/profiles/get-profile-by-username";

type AdminBadgesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminBadgesPage({
  searchParams,
}: AdminBadgesPageProps) {
  const params = searchParams ? await searchParams : {};
  const message = pickValue(params.message);
  const messageType = pickValue(params.type);
  const selectedUsername = pickValue(params.username)?.trim().toLowerCase() ?? "";
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/onboarding");
  }

  if (!canAccessAdmin(profile.username)) {
    notFound();
  }

  const [badges, targetProfile] = await Promise.all([
    getBadgeDefinitions(),
    selectedUsername ? getProfileByUsername(selectedUsername) : Promise.resolve(null),
  ]);
  const targetBadges = targetProfile ? await getProfileBadges(targetProfile.id) : [];

  return (
    <main className="flex-1 bg-zinc-950 px-4 py-5 text-zinc-100 sm:px-6 sm:py-6">
      <PageContainer className="flex flex-col gap-4">
        <AuthMessage message={message} type={messageType} />

        <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 px-5 py-5 sm:px-6">
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-zinc-50">
            Badge Admin
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Assign badges to usernames and manage what appears beside a player&apos;s
            display name on their public profile.
          </p>
        </section>

        <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
          <form className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end" action="/admin/badges">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-zinc-200">
                Find profile by username
              </span>
              <input
                type="text"
                name="username"
                defaultValue={selectedUsername}
                placeholder="misa"
                className="h-12 rounded-[16px] border border-zinc-800 bg-zinc-950 px-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-sky-400/50"
              />
            </label>
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-full bg-sky-400 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300"
            >
              Load Profile
            </button>
          </form>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
          <div className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-zinc-50">
                  Badge Assignment
                </h2>
                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  Choose a badge and assign it to a username.
                </p>
              </div>
              {targetProfile ? (
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-300">
                  @{targetProfile.username}
                </div>
              ) : null}
            </div>

            <form action={assignBadgeToUsername} className="mt-5 grid gap-4">
              <input type="hidden" name="username" value={targetProfile?.username ?? selectedUsername} />
              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-200">Badge</span>
                <select
                  name="badge_slug"
                  defaultValue=""
                  className="h-12 rounded-[16px] border border-zinc-800 bg-zinc-950 px-4 text-sm text-zinc-100 outline-none transition focus:border-sky-400/50"
                >
                  <option value="" disabled>
                    Select a badge
                  </option>
                  {badges.map((badge) => (
                    <option key={badge.id} value={badge.slug}>
                      {badge.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={!targetProfile}
                className="inline-flex h-11 items-center justify-center rounded-full bg-sky-400 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                Assign Badge
              </button>
            </form>
          </div>

          <div className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-zinc-50">
              Current Badges
            </h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              {targetProfile
                ? `Manage the badges currently shown for @${targetProfile.username}.`
                : "Load a username to manage their current badges."}
            </p>

            {targetProfile ? (
              targetBadges.length > 0 ? (
                <div className="mt-5 grid gap-3">
                  {targetBadges.map((badge) => (
                    <form
                      key={badge.slug}
                      action={removeBadgeFromUsername}
                      className="flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-zinc-950/80 px-4 py-3"
                    >
                      <input type="hidden" name="username" value={targetProfile.username} />
                      <input type="hidden" name="badge_slug" value={badge.slug} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-100">
                          {badge.label}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {badge.description ?? badge.slug}
                        </p>
                      </div>
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center justify-center rounded-full border border-rose-400/25 bg-rose-400/10 px-4 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/15"
                      >
                        Remove
                      </button>
                    </form>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[22px] border border-dashed border-zinc-800 bg-zinc-950/60 px-5 py-8 text-center">
                  <p className="text-sm font-medium text-zinc-200">
                    No badges assigned yet.
                  </p>
                </div>
              )
            ) : (
              <div className="mt-5 rounded-[22px] border border-dashed border-zinc-800 bg-zinc-950/60 px-5 py-8 text-center">
                <p className="text-sm font-medium text-zinc-200">
                  Pick a username to manage badges.
                </p>
              </div>
            )}
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
