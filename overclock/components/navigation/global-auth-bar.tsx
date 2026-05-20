import Image from "next/image";
import Link from "next/link";

import { PageContainer } from "@/components/app-shell/page-container";
import { GlobalNotificationsMenuClient } from "@/components/navigation/global-notifications-menu-client";
import { MainMenuUserSearch } from "@/components/navigation/main-menu-user-search";
import { UserMenu } from "@/components/navigation/user-menu";

type GlobalAuthBarProps = {
  profile: {
    avatar_url: string | null;
    display_name: string | null;
    username: string;
  } | null;
  userId?: string | null;
};

// Shared top-right auth controls for any page in the app shell.
export function GlobalAuthBar({ profile, userId }: GlobalAuthBarProps) {
  const signedInDiscoveryLinks = [
    { href: "/duos", label: "Duos" },
    { href: "/connections", label: "Connections" },
    { href: "/stacks", label: "Stacks" },
  ] as const;
  const guestDiscoveryLinks = [
    { href: "/duos", label: "Duos" },
    { href: "/stacks", label: "Stacks" },
    { href: "/login", label: "Sign in" },
  ] as const;

  const avatarUrl = profile?.avatar_url ?? null;
  const visibleName = profile?.username ?? "Account";
  const avatarFallback = (profile?.display_name ?? visibleName)
    .slice(0, 1)
    .toUpperCase();
  const profileHref = profile?.username ? `/u/${profile.username}` : "/onboarding";
  const discoveryLinks = userId ? signedInDiscoveryLinks : guestDiscoveryLinks;

  return (
    <header className="relative z-[70] border-b border-white/[0.04] bg-transparent px-6 py-3.5">
      <PageContainer
        className="flex items-center justify-between gap-4"
        maxWidthClassName="max-w-[120rem]"
      >
        <Link
          href="/"
          className="oc-profile-display flex items-center gap-2.5 text-[18px] font-semibold tracking-[-0.035em] text-white/92"
        >
          <Image
            src="/branding/kitty-v1/kitty-v1-white-cross-border.png"
            alt="Overclock logo"
            width={32}
            height={32}
            className="h-7 w-7 shrink-0 opacity-90"
            priority
          />
          <span>overclock.lol</span>
        </Link>

        <div className="flex items-center gap-3">
          <MainMenuUserSearch />

          <nav className="flex items-center gap-1">
            {discoveryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="oc-profile-display rounded-full border border-transparent px-3 py-2 text-[13px] font-semibold tracking-[-0.02em] text-zinc-400 transition hover:border-white/[0.08] hover:bg-[#171717] hover:text-zinc-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {userId ? (
            <>
              <GlobalNotificationsMenuClient currentProfileId={userId} />

              <UserMenu
                avatarFallback={avatarFallback}
                avatarUrl={avatarUrl}
                profileHref={profileHref}
                visibleName={visibleName}
              />
            </>
          ) : null}
        </div>
      </PageContainer>
    </header>
  );
}
