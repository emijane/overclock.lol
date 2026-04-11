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
  const discoveryLinks = [
    { href: "/duos", label: "Duos" },
    { href: "/stacks", label: "Stacks" },
    { href: "/scrims", label: "Scrims" },
    { href: "/teams", label: "Teams" },
  ] as const;

  return (
    <header className="border-b border-[#d7dee8] bg-[#f9f9f9] px-6 py-4">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-[#111827]">
          overclock.lol
        </Link>

        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-1">
            {discoveryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-transparent px-3 py-2 text-sm font-semibold text-[#4b5563] transition hover:border-[#d7dee8] hover:bg-[#f7f9fc] hover:text-[#111827]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <UserMenu
            avatarFallback={avatarFallback}
            avatarUrl={avatarUrl}
            profileHref={profileHref}
            visibleName={visibleName}
          />
        </div>
      </div>
    </header>
  );
}
