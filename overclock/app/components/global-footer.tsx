import Image from "next/image";
import Link from "next/link";

import { PageContainer } from "@/app/components/page-container";

const footerGroups = [
    {
        title: "Product",
        links: [
            { href: "/duos", label: "Placeholder Link" },
            { href: "/stacks", label: "Placeholder Link" },
        ],
    },
    {
        title: "Community",
        links: [
            { href: "/duos", label: "Placeholder Link" },
            { href: "/stacks", label: "Placeholder Link" },
        ],
    },
    {
        title: "Resources",
        links: [
            { href: "/account", label: "Placeholder Link" },
            { href: "/lfg", label: "Placeholder Link" },
        ],
    },
] as const;

export function GlobalFooter() {
    return (
        <footer className="mt-10 border-t border-white/5 bg-black/40">
            <PageContainer className="px-4 py-8 sm:px-6 sm:py-10">
                <div className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))]">
                    <div className="max-w-sm">
                        <Link
                            href="/"
                            className="flex items-center gap-3 text-sm font-semibold text-white/90"
                        >
                            <Image
                                src="/branding/kitty-white-cross-white-border.png"
                                alt="Overclock logo"
                                width={28}
                                height={28}
                                className="h-7 w-7 shrink-0"
                            />
                            <span>overclock.lol</span>
                        </Link>
                        <p className="mt-2 text-sm leading-6 text-white/45">
                            Build custom Overwatch player profiles, find duo
                            partners, create ranked stacks, and showcase your mains,
                            roles, rank, and playstyle.
                        </p>
                        <p className="mt-4 text-sm font-medium leading-5 text-transparent bg-gradient-to-r from-orange-100 via-rose-100 to-pink-100 bg-clip-text drop-shadow-[0_0_14px_rgba(251,113,133,0.4)]">
                            Logo art by{" "}
                            <Link
                                href="https://ioananenciu.carrd.co/"
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-transparent bg-gradient-to-r from-white via-rose-100 to-orange-100 bg-clip-text transition-all hover:from-white hover:via-white hover:to-rose-100"
                            >
                                neo ˃ 𖥦 ˂
                            </Link>
                        </p>
                    </div>

                    {footerGroups.map((group) => (
                        <div key={group.title}>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                                {group.title}
                            </p>
                            <div className="mt-3 flex flex-col gap-2">
                                {group.links.map((link) => (
                                    <Link
                                        key={`${group.title}-${link.href}`}
                                        href={link.href}
                                        className="text-sm text-white/55 transition-all duration-200 hover:text-white/85"
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
