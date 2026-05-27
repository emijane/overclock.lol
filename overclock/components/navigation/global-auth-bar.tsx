import Image from "next/image";
import Link from "next/link";

import { PageContainer } from "@/components/app-shell/page-container";
import { GlobalDiscoveryNav } from "@/components/navigation/global-discovery-nav";
import { GlobalNotificationsMenuClient } from "@/components/navigation/global-notifications-menu-client";
import { MainMenuUserSearch } from "@/components/navigation/main-menu-user-search";
import { UserMenu } from "@/components/navigation/user-menu";
import type { NotificationsMenuDto } from "@/lib/pages/matches-page-dto";

type GlobalAuthBarProps = {
  initialNotifications?: NotificationsMenuDto | null;
  profile: {
    avatar_url: string | null;
    display_name: string | null;
    username: string;
  } | null;
  userId?: string | null;
};

// Shared top-right auth controls for any page in the app shell.
export function GlobalAuthBar({
  initialNotifications,
  profile,
  userId,
}: GlobalAuthBarProps) {
  const signedInDiscoveryLinks = [
    { href: "/duos", label: "Duos" },
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
    <header className="relative z-[70] border-b border-white/[0.06] bg-[rgba(6,6,8,0.72)] px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-[rgba(6,6,8,0.62)] sm:px-6 sm:py-3.5">
      <PageContainer
        className="flex items-center justify-between gap-3 sm:gap-4"
        maxWidthClassName="max-w-[120rem]"
      >
        <Link
          href="/"
          className="oc-profile-display flex shrink-0 items-center gap-2.5 text-[17px] font-semibold tracking-[-0.035em] text-white/92 sm:text-[18px]"
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

        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-2.5 lg:gap-3">
          <MainMenuUserSearch />

          <GlobalDiscoveryNav links={discoveryLinks} />

          {userId ? (
            <div className="flex shrink-0 items-center gap-2">
              <GlobalNotificationsMenuClient
                currentProfileId={userId}
                initialNotifications={initialNotifications ?? null}
              />

              <UserMenu
                avatarFallback={avatarFallback}
                avatarUrl={avatarUrl}
                profileHref={profileHref}
                visibleName={visibleName}
              />
            </div>
          ) : null}
        </div>
      </PageContainer>
    </header>
  );
}
