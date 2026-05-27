"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquareIcon,
  SettingsIcon,
  TrophyIcon,
  UserIcon,
  Users2Icon,
  UsersRoundIcon,
} from "lucide-react";

type GlobalSidebarNavProps = {
  profileHref?: string | null;
  signedIn?: boolean;
};

type GlobalNavItem = {
  href: string;
  icon: typeof UserIcon;
  label: string;
  match: (pathname: string, profileHref?: string | null) => boolean;
};

const SIGNED_IN_NAV_ITEMS: GlobalNavItem[] = [
  {
    href: "__profile__",
    icon: UserIcon,
    label: "My profile",
    match: (pathname, profileHref) => Boolean(profileHref && pathname === profileHref),
  },
  {
    href: "/account",
    icon: SettingsIcon,
    label: "Account",
    match: (pathname) => pathname === "/account",
  },
  {
    href: "/account/competitive",
    icon: TrophyIcon,
    label: "Competitive",
    match: (pathname) => pathname.startsWith("/account/competitive"),
  },
  {
    href: "/account/posts",
    icon: MessageSquareIcon,
    label: "My posts",
    match: (pathname) => pathname.startsWith("/account/posts"),
  },
  {
    href: "/connections",
    icon: UsersRoundIcon,
    label: "Connections",
    match: (pathname) => pathname === "/connections",
  },
  {
    href: "/duos",
    icon: UsersRoundIcon,
    label: "Duos",
    match: (pathname) => pathname === "/duos" || pathname.startsWith("/duos/"),
  },
  {
    href: "/stacks",
    icon: Users2Icon,
    label: "Stacks",
    match: (pathname) => pathname === "/stacks" || pathname.startsWith("/stacks/"),
  },
] as const;

const GUEST_NAV_ITEMS: GlobalNavItem[] = [
  {
    href: "/duos",
    icon: UsersRoundIcon,
    label: "Duos",
    match: (pathname: string) => pathname === "/duos" || pathname.startsWith("/duos/"),
  },
  {
    href: "/stacks",
    icon: Users2Icon,
    label: "Stacks",
    match: (pathname: string) => pathname === "/stacks" || pathname.startsWith("/stacks/"),
  },
  {
    href: "/login",
    icon: UserIcon,
    label: "Sign in",
    match: (pathname: string) => pathname === "/login",
  },
] as const;

const GLOBAL_NAV_SUBHEADING = "/ OVERCLOCK";

export function GlobalSidebarNav({
  profileHref = null,
  signedIn = false,
}: GlobalSidebarNavProps) {
  const pathname = usePathname();
  const items = signedIn ? SIGNED_IN_NAV_ITEMS : GUEST_NAV_ITEMS;

  return (
    <nav aria-label="Primary navigation" className="p-2">
      <p className="oc-profile-meta px-2.5 pb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-300">
        {GLOBAL_NAV_SUBHEADING}
      </p>
      <ul className="space-y-px">
        {items.map((item) => {
          const href =
            item.href === "__profile__" ? (profileHref ?? "/login") : item.href;
          const isActive =
            item.href === "__profile__"
              ? item.match(pathname, profileHref)
              : item.match(pathname);

          return (
            <li key={`${item.label}-${href}`}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex h-8 items-center gap-2 rounded-[10px] px-2.5 font-mono text-[12px] font-medium transition ${
                  isActive
                    ? "bg-white/[0.07] text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
                }`}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0 opacity-60" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
