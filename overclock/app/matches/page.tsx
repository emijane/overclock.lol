import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { PageContainer } from "@/app/components/page-container";
import { PageReveal } from "@/app/components/page-reveal";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

export default async function MatchesPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <main className="relative flex-1 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_30%),radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.08),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.03),transparent_18%),#09090b] px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.7)_0.6px,transparent_0.95px)] bg-[length:11px_11px] opacity-68 [mask-image:radial-gradient(circle_at_34%_12%,black_0,black_12%,transparent_28%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(224,242,254,0.68)_0.6px,transparent_0.95px)] bg-[length:11px_11px] opacity-64 [mask-image:radial-gradient(circle_at_72%_62%,black_0,black_10%,transparent_24%)]"
      />
      <PageContainer
        className="relative z-10 flex flex-col gap-3"
        maxWidthClassName="max-w-4xl"
      >
        <section className="rounded-[28px]">
          <div className="overflow-hidden rounded-[28px]">
            <PageReveal>
              <header className="py-4 sm:py-5">
                <div className="space-y-2.5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <Link
                        href="/account"
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 transition hover:text-zinc-300"
                      >
                        <ChevronLeftIcon className="h-3.5 w-3.5 shrink-0" />
                        Account
                      </Link>
                      <div className="space-y-2">
                        <h1 className="text-3xl font-semibold tracking-[-0.07em] text-zinc-50 sm:text-4xl">
                          Matches
                        </h1>
                        <p className="max-w-2xl text-sm leading-6 text-zinc-400">
                          Accepted play invites, pending outgoing invites, and
                          match history will live here.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </header>
            </PageReveal>

            <PageReveal delay={1}>
              <div className="rounded-[28px] border border-white/[0.08] bg-[#05070b] shadow-[0_24px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)] ring-1 ring-white/5">
                <section className="border-b border-white/8 px-5 py-5 sm:px-6 sm:py-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Coming next
                  </p>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                    This page will mirror the rest of the app with dedicated
                    blocks for active matches, pending sent invites, and past
                    matches.
                  </p>
                </section>

                <section className="grid gap-3 px-5 py-5 sm:px-6 sm:py-6">
                  <div className="rounded-[16px] border border-white/10 bg-[#05070b] p-4">
                    <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-zinc-100">
                      Active / Recent Matches
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                      Accepted connections will appear here with unlocked contact
                      details.
                    </p>
                  </div>

                  <div className="rounded-[16px] border border-white/10 bg-[#05070b] p-4">
                    <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-zinc-100">
                      Pending Sent Invites
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                      Outgoing invites that are still waiting on a response will
                      appear here.
                    </p>
                  </div>

                  <div className="rounded-[16px] border border-dashed border-white/12 bg-white/[0.02] px-5 py-10 text-center">
                    <p className="text-sm font-medium text-zinc-200">
                      Matches are not live yet.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      We&apos;ll fill in these blocks as invite-to-play ships in
                      the next baby steps.
                    </p>
                  </div>
                </section>
              </div>
            </PageReveal>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
