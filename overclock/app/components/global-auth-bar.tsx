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
    <header className="border-b border-zinc-900 bg-black px-6 py-4">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <Link href={profileHref} className="flex min-w-0 items-center gap-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={`${visibleName} avatar`}
              className="h-9 w-9 rounded-full border border-zinc-800 object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-sm font-semibold text-zinc-200">
              {avatarFallback}
            </div>
          )}
          <span className="truncate text-sm font-medium text-zinc-200">
            @{visibleName}
          </span>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link
            href={profileHref}
            className="rounded-full px-3 py-2 font-medium text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
          >
            Profile
          </Link>
          <Link
            href="/account"
            className="rounded-full px-3 py-2 font-medium text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
          >
            Account
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-full border border-zinc-800 px-3 py-2 font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
            >
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
