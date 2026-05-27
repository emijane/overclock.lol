"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers3Icon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  UsersRoundIcon,
} from "lucide-react";

const ACCOUNT_NAV_ITEMS = [
  {
    href: "/account",
    icon: SlidersHorizontalIcon,
    label: "General",
    match: (pathname: string) => pathname === "/account",
  },
  {
    href: "/account/competitive",
    icon: ShieldCheckIcon,
    label: "Competitive",
    match: (pathname: string) => pathname.startsWith("/account/competitive"),
  },
  {
    href: "/account/posts",
    icon: Layers3Icon,
    label: "My posts",
    match: (pathname: string) => pathname.startsWith("/account/posts"),
  },
  {
    href: "/connections",
    icon: UsersRoundIcon,
    label: "Connections",
    match: (pathname: string) => pathname === "/connections",
  },
] as const;

type AccountSettingsNavigationProps = {
  mobile?: boolean;
};

export function AccountSettingsNavigation({
  mobile = false,
}: AccountSettingsNavigationProps) {
  const pathname = usePathname();

  if (mobile) {
    return (
      <nav aria-label="Account settings sections" className="overflow-x-auto">
        <div className="flex min-w-max items-center gap-1">
          {ACCOUNT_NAV_ITEMS.map((item) => {
            const isActive = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex h-7 items-center gap-1.5 rounded-[8px] border px-2.5 font-mono text-[11px] font-medium transition ${
                  isActive
                    ? "border-white/[0.1] bg-white/[0.07] text-zinc-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    : "border-transparent text-zinc-500 hover:border-white/[0.06] hover:bg-white/[0.03] hover:text-zinc-200"
                }`}
              >
                <item.icon className="h-3 w-3 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label="Account settings sections" className="sticky top-8 p-2">
      <ul className="space-y-px">
        {ACCOUNT_NAV_ITEMS.map((item) => {
          const isActive = item.match(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
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
