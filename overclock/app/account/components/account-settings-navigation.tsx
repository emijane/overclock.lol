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
        className="overflow-x-auto rounded-[10px] border border-white/[0.04] bg-white/[0.02] p-2"
      >
        <div className="flex min-w-max items-center gap-2">
          {ACCOUNT_NAV_ITEMS.map((item) => {
            const isActive = item.match(pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex h-8 items-center gap-2 rounded-[8px] border px-3 text-[12px] font-semibold transition ${
                  isActive
                    ? "border-white/[0.1] bg-white/[0.07] text-zinc-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
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
    <section className="sticky top-6 hidden w-56 shrink-0 self-start flex-col gap-3 rounded-[10px] border border-white/[0.03] bg-white/[0.01] p-3 lg:flex">
      <div>
        <p
          className="oc-profile-meta mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: "rgb(228 228 231 / 0.9)" }}
        >
          Account
        </p>
        <p className="text-[11px] leading-5 text-zinc-500">
          Settings, profile setup, and post management.
        </p>
      </div>

      <div className="border-t border-white/[0.03]" />

      <nav aria-label="Account settings sections" className="space-y-px">
        <ul className="space-y-1.5">
          {ACCOUNT_NAV_ITEMS.map((item) => {
            const isActive = item.match(pathname);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-start gap-2.5 rounded-[8px] px-2.5 py-2.5 transition ${
                    isActive
                      ? "bg-white/[0.06] text-zinc-200"
                      : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border ${
                      isActive
                        ? "border-white/[0.08] bg-white/[0.06] text-zinc-50"
                        : "border-white/[0.05] bg-white/[0.025] text-zinc-500"
                    }`}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="oc-profile-display block text-[13px] font-semibold tracking-[-0.02em]">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-4.5 text-zinc-500">
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
