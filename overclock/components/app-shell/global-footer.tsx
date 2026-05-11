import Image from "next/image";
import Link from "next/link";

import { PageContainer } from "@/components/app-shell/page-container";

const footerGroups = [
  {
    title: "Product",
    links: [
      { href: "/duos", label: "Duos" },
      { href: "/stacks", label: "Stacks" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "/connections", label: "Connections" },
      { href: "/login", label: "Sign in" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
    ],
  },
] as const;

export function GlobalFooter() {
  return (
    <footer className="mt-auto border-t border-white/[0.035] bg-black/[0.08]">
      <PageContainer className="px-4 py-5 sm:px-6 sm:py-6">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_repeat(3,minmax(0,0.8fr))]">
          <div className="max-w-[15rem]">
            <Link
              href="/"
              className="oc-profile-display flex items-center gap-2.5 text-[13px] font-semibold tracking-[-0.02em] text-white/88"
            >
              <Image
                src="/branding/kitty-v1/kitty-v1-white-cross-border.png"
                alt="Overclock logo"
                width={28}
                height={28}
                className="h-6 w-6 shrink-0"
              />
              <span>overclock.lol</span>
            </Link>
            <p className="oc-profile-meta mt-2.5 text-[11px] font-medium leading-4 text-white/50">
              developed by{" "}
              <Link
                href="https://x.com/pcexplodes"
                target="_blank"
                rel="noreferrer"
                className="oc-profile-display font-semibold text-white/68 transition-colors hover:text-white/88"
              >
                emi
              </Link>
            </p>
            <p className="oc-profile-meta mt-1 text-[11px] font-medium leading-4 text-white/50">
              logo art by{" "}
              <Link
                href="https://ioananenciu.carrd.co/"
                target="_blank"
                rel="noreferrer"
                className="oc-profile-display font-semibold text-white/68 transition-colors hover:text-white/88"
              >
                neo
              </Link>
            </p>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <p className="oc-profile-meta text-[10px] font-semibold uppercase tracking-[0.14em] text-white/38">
                {group.title}
              </p>
              <div className="mt-2.5 flex flex-col gap-1.5">
                {group.links.map((link) => (
                  <Link
                    key={`${group.title}-${link.href}`}
                    href={link.href}
                    className="oc-profile-display text-[13px] font-medium tracking-[-0.01em] text-white/52 transition-all duration-200 hover:text-white/82"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </footer>
  );
}
