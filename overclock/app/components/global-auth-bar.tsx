import Link from "next/link";

import { signOut } from "@/app/auth/actions";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

// Shared top-right auth controls for any page in the app shell.
export async function GlobalAuthBar() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    return null;
  }

  const avatarUrl = profile?.discord_avatar_url ?? null;
  const visibleName = profile?.username ?? "Account";
  const avatarFallback = (profile?.display_name ?? visibleName)
    .slice(0, 1)
    .toUpperCase();
  const profileHref = profile?.username ? `/u/${profile.username}` : "/onboarding";

  return (
    <div className="mx-auto flex w-full max-w-6xl justify-end px-6 pt-6">
      <div className="flex items-center gap-3 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-2">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={`${visibleName} avatar`}
            className="h-9 w-9 rounded-full border border-slate-700 object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-sm font-semibold text-slate-200">
            {avatarFallback}
          </div>
        )}
        <span className="hidden text-sm text-slate-300 sm:inline">
          @{visibleName}
        </span>
        <Link
          href={profileHref}
          className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-sky-400 hover:text-sky-200"
        >
          Profile
        </Link>
        <Link
          href="/account"
          className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-slate-600"
        >
          Account
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
