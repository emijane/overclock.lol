"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers3Icon, ShieldCheckIcon, SlidersHorizontalIcon } from "lucide-react";

const ACCOUNT_NAV_ITEMS = [
  {
    description: "Profile, presence, and safety controls",
    href: "/account",
    icon: SlidersHorizontalIcon,
    label: "General",
    match: (pathname: string) => pathname === "/account",
  },
  {
    description: "Ranks, roles, and hero setup",
    href: "/account/competitive",
    icon: ShieldCheckIcon,
    label: "Competitive profile",
    match: (pathname: string) => pathname.startsWith("/account/competitive"),
  },
  {
    description: "Review active and past listings",
    href: "/account/posts",
    icon: Layers3Icon,
    label: "My posts",
    match: (pathname: string) => pathname.startsWith("/account/posts"),
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
      <nav
        aria-label="Account settings sections"
        className="oc-surface-panel overflow-x-auto rounded-[22px] p-2"
      >
        <div className="flex min-w-max items-center gap-2">
          {ACCOUNT_NAV_ITEMS.map((item) => {
            const isActive = item.match(pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex h-9 items-center gap-2 rounded-[12px] border px-3 text-[12px] font-semibold transition ${
                  isActive
                    ? "border-white/[0.1] bg-white/[0.07] text-zinc-50"
                    : "border-transparent bg-transparent text-zinc-500 hover:border-white/[0.06] hover:bg-white/[0.03] hover:text-zinc-200"
                }`}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="oc-profile-display">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <section className="oc-surface-panel sticky top-24 overflow-hidden rounded-[24px]">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <p className="oc-profile-meta text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Settings
        </p>
        <h2 className="oc-profile-display mt-1.5 text-[20px] font-semibold tracking-[-0.04em] text-zinc-50">
          Account
        </h2>
        <p className="mt-2 text-[13px] leading-6 text-zinc-400">
          Manage your profile, competitive setup, post history, and safety controls.
        </p>
      </div>

      <nav aria-label="Account settings sections" className="p-2">
        <ul className="space-y-1.5">
          {ACCOUNT_NAV_ITEMS.map((item) => {
            const isActive = item.match(pathname);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-start gap-3 rounded-[16px] border px-3.5 py-3 transition ${
                    isActive
                      ? "border-white/[0.09] bg-white/[0.05] text-zinc-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                      : "border-transparent text-zinc-400 hover:border-white/[0.06] hover:bg-white/[0.03] hover:text-zinc-100"
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border ${
                      isActive
                        ? "border-white/[0.08] bg-white/[0.06] text-zinc-50"
                        : "border-white/[0.05] bg-white/[0.025] text-zinc-500"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="oc-profile-display block text-[14px] font-semibold tracking-[-0.02em]">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-[12px] leading-5 text-zinc-500">
                      {item.description}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </section>
  );
}
