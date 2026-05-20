import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { DarkPageShell } from "@/components/app-shell/dark-page-shell";
import { PageReveal } from "@/components/app-shell/page-reveal";
import { MatchCard } from "@/features/matches/components/match-card";
import { MatchInvitesTabs } from "@/features/matches/components/match-invites-tabs";
import { MatchesRealtimeRefresh } from "@/features/matches/components/matches-realtime-refresh";
import type { MatchesPageDto } from "@/lib/pages/matches-page-dto";

type MatchesPageViewProps = {
  currentProfileId: string;
  dto: MatchesPageDto;
};

export function MatchesPageView({
  currentProfileId,
  dto,
}: MatchesPageViewProps) {
  const connections = dto.connections;
  const pendingSentInvites = dto.outgoingInvites;
  const incomingPendingInvites = dto.incomingInvites;

  return (
    <DarkPageShell
      containerClassName="flex flex-col gap-3"
      maxWidthClassName="max-w-4xl"
      variant="matches"
    >
        <MatchesRealtimeRefresh currentProfileId={currentProfileId} />
        <section className="oc-profile-shell rounded-[12px] bg-[#111111] p-px">
          <div className="overflow-hidden rounded-[11px] bg-[#090909]">
            <PageReveal>
              <header className="px-5 py-4 sm:px-6 sm:py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <Link
                      href="/account"
                      className="oc-profile-meta inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:text-zinc-300"
                    >
                      <ChevronLeftIcon className="h-3.5 w-3.5 shrink-0" />
                      Account
                    </Link>
                    <h1 className="oc-profile-display text-[34px] font-bold leading-[0.98] tracking-[-0.045em] text-zinc-50 sm:text-[40px]">
                      Connections
                    </h1>
                  </div>
                </div>
              </header>
            </PageReveal>

            <PageReveal delay={1}>
              <section className="grid gap-3 px-5 pb-5 sm:px-6 sm:pb-6">
                <MatchInvitesTabs
                  incomingInvites={incomingPendingInvites}
                  outgoingInvites={pendingSentInvites}
                />

                <div className="overflow-hidden rounded-[12px] border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 sm:px-5">
                    <div>
                      <p className="oc-profile-meta text-[11px] font-semibold uppercase tracking-[0.18em]">
                        Active connections
                      </p>
                    </div>
                    <span className="oc-profile-meta inline-flex min-w-8 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-zinc-300">
                      {connections.length}
                    </span>
                  </div>

                  {connections.length > 0 ? (
                    <div className="max-h-[32rem] overflow-y-auto">
                      <ul>
                        {connections.map((connection, index) => (
                          <li
                            key={connection.id}
                            className={index < connections.length - 1 ? "border-b border-white/[0.06]" : ""}
                          >
                            <MatchCard connection={connection} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="px-5 py-8 text-center">
                      <p className="oc-profile-meta text-sm">No connections yet.</p>
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
