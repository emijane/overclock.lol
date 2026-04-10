import Link from "next/link";

import { UserMenu } from "@/app/components/user-menu";
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
        <Link href="/" className="text-xl font-bold text-white">
          overclock.lol
        </Link>

        <UserMenu
          avatarFallback={avatarFallback}
          avatarUrl={avatarUrl}
          profileHref={profileHref}
          visibleName={visibleName}
        />
      </div>
    </header>
  );
}
