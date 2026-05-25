"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type DiscoveryLink = {
  href: string;
  label: string;
};

function isLinkActive(pathname: string, href: string) {
  if (href === "/login") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function GlobalDiscoveryNav({ links }: { links: readonly DiscoveryLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center justify-end gap-1">
      {links.map((link) => {
        const isActive = isLinkActive(pathname, link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`oc-profile-display inline-flex h-9 items-center rounded-[10px] border px-3 text-[13px] font-semibold tracking-[-0.02em] transition ${
              isActive
                ? "border-white/[0.10] bg-white/[0.06] text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                : "border-transparent text-zinc-400 hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-zinc-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
