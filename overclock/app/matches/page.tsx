import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { MatchInvitesTabs } from "@/app/matches/match-invites-tabs";
import { MatchCard } from "@/app/matches/match-card";
import { MatchesRealtimeRefresh } from "@/app/matches/matches-realtime-refresh";
import { PageContainer } from "@/app/components/page-container";
import { PageReveal } from "@/app/components/page-reveal";
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
    <main className="relative flex-1 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_30%),radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.08),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.03),transparent_18%),#09090b] px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.7)_0.6px,transparent_0.95px)] bg-size-[11px_11px] opacity-68 mask-[radial-gradient(circle_at_34%_12%,black_0,black_12%,transparent_28%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(224,242,254,0.68)_0.6px,transparent_0.95px)] bg-size-[11px_11px] opacity-64 mask-[radial-gradient(circle_at_72%_62%,black_0,black_10%,transparent_24%)]"
      />
      <PageContainer
        className="relative z-10 flex flex-col gap-3"
        maxWidthClassName="max-w-4xl"
      >
        <MatchesRealtimeRefresh currentProfileId={profile.id} />
        <section className="rounded-[28px]">
          <div className="overflow-hidden rounded-[28px]">
            <PageReveal>
              <header className="py-4 sm:py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <Link
                      href="/account"
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 transition hover:text-zinc-300"
                    >
                      <ChevronLeftIcon className="h-3.5 w-3.5 shrink-0" />
                      Account
                    </Link>
                    <h1 className="text-3xl font-semibold tracking-[-0.07em] text-zinc-50 sm:text-4xl">
                      Connections
                    </h1>
                  </div>
                </div>
              </header>
            </PageReveal>

            <PageReveal delay={1}>
              <section className="grid gap-4">
                <MatchInvitesTabs
                  incomingInvites={incomingPendingInvites}
                  outgoingInvites={pendingSentInvites}
                />

                <div className="overflow-hidden rounded-[22px] border border-white/8 bg-[#05070b] shadow-[0_24px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)]">
                  {connections.length > 0 ? (
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
                  ) : (
                    <div className="px-5 py-10 text-center">
                      <p className="text-sm text-zinc-500">No connections yet.</p>
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
