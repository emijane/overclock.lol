import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { MatchInvitesTabs } from "@/app/matches/match-invites-tabs";
import { MatchCard } from "@/app/matches/match-card";
import { MatchesRealtimeRefresh } from "@/app/matches/matches-realtime-refresh";
import { PageContainer } from "@/components/app-shell/page-container";
import { PageReveal } from "@/components/app-shell/page-reveal";
import {
  expirePlayInvitesRecord,
  getActiveProfileConnections,
  getIncomingPendingPlayInvites,
  getPendingSentPlayInvites,
} from "@/lib/matches/play-invites";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

export default async function MatchesPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/onboarding");
  }

  await expirePlayInvitesRecord();

  const [connections, pendingSentInvites, incomingPendingInvites] = await Promise.all([
    getActiveProfileConnections({ currentProfileId: profile.id }),
    getPendingSentPlayInvites({ currentProfileId: profile.id }),
    getIncomingPendingPlayInvites({ currentProfileId: profile.id, limit: 20 }).then(
      (result) => result.invites
    ),
  ]);

  return (
    <main className="relative flex-1 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.045),transparent_24%),radial-gradient(circle_at_22%_0%,rgba(120,140,180,0.06),transparent_26%),radial-gradient(circle_at_80%_8%,rgba(255,255,255,0.03),transparent_20%),linear-gradient(180deg,#0b0b0d_0%,#09090b_44%,#070709_100%)] px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.42)_0.6px,transparent_0.95px)] bg-[length:11px_11px] opacity-18 [mask-image:radial-gradient(circle_at_34%_12%,black_0,black_12%,transparent_28%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(224,242,254,0.36)_0.6px,transparent_0.95px)] bg-[length:11px_11px] opacity-14 [mask-image:radial-gradient(circle_at_72%_62%,black_0,black_10%,transparent_24%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.03),transparent_30%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_46%,rgba(0,0,0,0.18)_78%,rgba(0,0,0,0.34)_100%)]"
      />
      <PageContainer
        className="relative z-10 flex flex-col gap-3"
        maxWidthClassName="max-w-4xl"
      >
        <MatchesRealtimeRefresh currentProfileId={profile.id} />
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
      </PageContainer>
    </main>
  );
}
