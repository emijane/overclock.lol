import Image from "next/image";
import Link from "next/link";

import { PageContainer } from "@/app/components/page-container";
import { GlobalNotificationsMenu } from "@/app/components/global-notifications-menu";
import { UserMenu } from "@/app/components/user-menu";

type GlobalAuthBarProps = {
  profile: {
    discord_avatar_url: string | null;
    display_name: string | null;
    username: string;
  } | null;
  userId?: string | null;
};

// Shared top-right auth controls for any page in the app shell.
export function GlobalAuthBar({ profile, userId }: GlobalAuthBarProps) {
  if (!userId) {
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
    { href: "/connections", label: "Connections" },
    { href: "/stacks", label: "Stacks" },
  ] as const;

  return (
    <header className="border-b border-white/5 bg-black/40 px-6 py-4 backdrop-blur-md">
      <PageContainer
        className="flex items-center justify-between gap-4"
        maxWidthClassName="max-w-[96rem]"
      >
        <Link
          href="/"
          className="flex items-center gap-3 text-xl font-bold tracking-tight text-white"
        >
          <Image
            src="/branding/kitty-white-cross-white-border.png"
            alt="Overclock logo"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0"
            priority
          />
          <span>overclock.lol</span>
        </Link>

        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-1">
            {discoveryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-transparent px-3 py-2 text-sm font-semibold text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <GlobalNotificationsMenu currentProfileId={userId} />

          <UserMenu
            avatarFallback={avatarFallback}
            avatarUrl={avatarUrl}
            profileHref={profileHref}
            visibleName={visibleName}
          />
        </div>
      </PageContainer>
    </header>
  );
}
