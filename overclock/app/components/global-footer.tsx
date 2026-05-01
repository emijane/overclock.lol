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
            { href: "/scrims", label: "Placeholder Link" },
            { href: "/teams", label: "Placeholder Link" },
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
        <footer className="mt-10 border-t border-white/5 bg-black/20 backdrop-blur-sm">
            <PageContainer className="px-4 py-8 sm:px-6 sm:py-10">
                <div className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))]">
                    <div className="max-w-sm">
                        <p className="text-sm font-semibold text-white/90">
                            overclock.lol
                        </p>
                        <p className="mt-2 text-sm leading-6 text-white/45">
                            Placeholder footer copy for future product, community,
                            and support links.
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
