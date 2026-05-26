import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { DarkPageShell } from "@/components/app-shell/dark-page-shell";
import { PageReveal } from "@/components/app-shell/page-reveal";
import { MatchCard } from "@/features/matches/components/match-card";
import { MatchInvitesTabs } from "@/features/matches/components/match-invites-tabs";
import type { MatchesPageDto } from "@/lib/pages/matches-page-dto";

type MatchesPageViewProps = {
  dto: MatchesPageDto;
};

export function MatchesPageView({ dto }: MatchesPageViewProps) {
  const connections = dto.connections;
  const pendingSentInvites = dto.outgoingInvites;
  const incomingPendingInvites = dto.incomingInvites;
  const totalRelationships =
    connections.length + pendingSentInvites.length + incomingPendingInvites.length;

  return (
    <DarkPageShell
      containerClassName="flex flex-col gap-3"
      maxWidthClassName="max-w-4xl"
      variant="matches"
    >
      <section className="rounded-[28px]">
        <div className="overflow-hidden rounded-[28px]">
          <PageReveal>
            <header className="py-4 sm:py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                  <Link
                    href="/account"
                    className="oc-profile-meta inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:text-zinc-300"
                  >
                    <ChevronLeftIcon className="h-3.5 w-3.5 shrink-0" />
                    Account
                  </Link>
                  <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-[-0.07em] text-zinc-50 sm:text-4xl">
                      Connections
                    </h1>
                    <p className="text-sm text-zinc-500">
                      Keep invites moving and manage the players already in your orbit.
                    </p>
                  </div>
                </div>
                <span className="oc-profile-meta inline-flex w-fit items-center rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
                  {totalRelationships} total
                </span>
              </div>
            </header>
          </PageReveal>

          <PageReveal delay={1}>
            <section className="grid gap-3">
              <MatchInvitesTabs
                incomingInvites={incomingPendingInvites}
                outgoingInvites={pendingSentInvites}
              />

              <div className="oc-surface-panel overflow-hidden rounded-[22px]">
                <div className="flex items-center justify-between border-b border-white/6 px-4 py-4 sm:px-5">
                  <div>
                    <p className="oc-profile-meta text-[11px] font-semibold uppercase tracking-[0.18em]">
                      Network
                    </p>
                    <h2 className="oc-profile-display mt-1 text-[15px] font-semibold tracking-[-0.02em] text-zinc-100">
                      Active connections
                    </h2>
                  </div>
                  <span className="oc-profile-meta inline-flex min-w-8 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-zinc-300">
                    {connections.length}
                  </span>
                </div>

                {connections.length > 0 ? (
                  <div className="max-h-[32rem] overflow-y-auto">
                    <ul>
                      {connections.map((connection, index) => (
                        <li
                          key={connection.id}
                          className={index < connections.length - 1 ? "border-b border-white/6" : ""}
                        >
                          <MatchCard connection={connection} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <p className="oc-profile-display text-sm font-medium tracking-[-0.01em] text-zinc-200">
                      No connections yet
                    </p>
                    <p className="oc-profile-meta mt-1 text-sm">
                      Accepted invites will show up here once you match with someone.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </PageReveal>
        </div>
      </section>
    </DarkPageShell>
  );
}
