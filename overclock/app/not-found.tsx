import Link from "next/link";

import { PageContainer } from "@/components/app-shell/page-container";
import { PageReveal } from "@/components/app-shell/page-reveal";

export default function NotFound() {
  return (
    <main className="relative flex flex-1 flex-col bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_30%),radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.08),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.03),transparent_18%),#09090b] px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.7)_0.6px,transparent_0.95px)] bg-[length:11px_11px] opacity-68 [mask-image:radial-gradient(circle_at_34%_12%,black_0,black_12%,transparent_28%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(224,242,254,0.68)_0.6px,transparent_0.95px)] bg-[length:11px_11px] opacity-64 [mask-image:radial-gradient(circle_at_72%_62%,black_0,black_10%,transparent_24%)]"
      />
      <PageContainer
        className="relative z-10 flex flex-1 flex-col justify-center"
        maxWidthClassName="max-w-4xl"
      >
        <PageReveal delay={1}>
          <section className="mx-auto w-full max-w-md text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              404
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.07em] text-zinc-50 sm:text-4xl">
              Page not found
            </h1>
            <p className="mt-3 text-[16px] leading-7 tracking-[-0.015em] text-zinc-400">
              This page doesn&apos;t exist or was moved. Check the URL and try again.
            </p>
            <div className="mt-8">
              <Link
                href="/"
                className="inline-flex h-8 items-center rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-zinc-100 backdrop-blur-md transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
              >
                Go home
              </Link>
            </div>
          </section>
        </PageReveal>
      </PageContainer>
    </main>
  );
}
