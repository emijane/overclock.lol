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
  getAcceptedPlayMatches,
  getIncomingPendingPlayInvites,
  getPendingSentPlayInvites,
} from "@/lib/matches/play-invites";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

const RECENT_MATCH_LIMIT = 6;

function formatDateTime(value: string | null) {
  if (!value) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function MatchesPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/onboarding");
  }

  await expirePlayInvitesRecord();

  const [acceptedMatches, pendingSentInvites, incomingPendingInvites] = await Promise.all([
    getAcceptedPlayMatches({ currentProfileId: profile.id }),
    getPendingSentPlayInvites({ currentProfileId: profile.id }),
    getIncomingPendingPlayInvites({ currentProfileId: profile.id, limit: 20 }).then(
      (result) => result.invites
    ),
  ]);
  const recentMatches = acceptedMatches.slice(0, RECENT_MATCH_LIMIT);
  const pastMatches = acceptedMatches.slice(RECENT_MATCH_LIMIT);
  const hasAnyMatches =
    acceptedMatches.length > 0 ||
    pendingSentInvites.length > 0 ||
    incomingPendingInvites.length > 0;

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
        <MatchesRealtimeRefresh currentProfileId={profile.id} />
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
                      </div>
                    </div>
                  </div>
                </div>
              </header>
            </PageReveal>

            <PageReveal delay={1}>
              <section className="grid gap-4">
                <div className="rounded-[22px] border border-white/[0.08] bg-[#05070b] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-5">
                  <div className="grid gap-3">
                    <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-zinc-100">
                      Recent Matches
                    </h2>
                    {recentMatches.length > 0 ? (
                      recentMatches.map((match) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          acceptedAtLabel={formatDateTime(match.acceptedAt)}
                        />
                      ))
                    ) : (
                      <div className="rounded-[20px] border border-dashed border-white/12 bg-white/[0.02] px-4 py-6">
                        <p className="text-sm font-medium text-zinc-200">
                          No accepted matches yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <MatchInvitesTabs
                  incomingInvites={incomingPendingInvites.map((invite) => ({
                    createdAtLabel: formatDateTime(invite.createdAt),
                    expiresAtLabel: formatDateTime(invite.expiresAt),
                    invite,
                  }))}
                  outgoingInvites={pendingSentInvites.map((invite) => ({
                    createdAtLabel: formatDateTime(invite.createdAt),
                    expiresAtLabel: formatDateTime(invite.expiresAt),
                    invite,
                  }))}
                />

                {pastMatches.length > 0 ? (
                  <div className="grid gap-3">
                    <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-zinc-100">
                      Past Matches
                    </h2>
                    {pastMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        acceptedAtLabel={formatDateTime(match.acceptedAt)}
                      />
                    ))}
                  </div>
                ) : null}

                {!hasAnyMatches ? (
                  <div className="rounded-[20px] border border-dashed border-white/12 bg-white/[0.02] px-5 py-10 text-center">
                    <p className="text-sm font-medium text-zinc-200">
                      No matches yet.
                    </p>
                  </div>
                ) : null}
              </section>
            </PageReveal>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
