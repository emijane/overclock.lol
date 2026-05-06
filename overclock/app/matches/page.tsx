import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { MatchCard } from "@/app/matches/match-card";
import { PendingSentInviteCard } from "@/app/matches/pending-sent-invite-card";
import { PageContainer } from "@/app/components/page-container";
import { PageReveal } from "@/app/components/page-reveal";
import {
  expirePlayInvitesRecord,
  getAcceptedPlayMatches,
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

  const [acceptedMatches, pendingSentInvites] = await Promise.all([
    getAcceptedPlayMatches({ currentProfileId: profile.id }),
    getPendingSentPlayInvites({ currentProfileId: profile.id }),
  ]);
  const recentMatches = acceptedMatches.slice(0, RECENT_MATCH_LIMIT);
  const pastMatches = acceptedMatches.slice(RECENT_MATCH_LIMIT);
  const hasAnyMatches = acceptedMatches.length > 0 || pendingSentInvites.length > 0;

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
                          Accepted play invites now unlock contact details here,
                          and pending outgoing invites stay separate until the
                          other player responds.
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
                    Match hub
                  </p>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                    This first pass keeps accepted connections, pending outgoing
                    invites, and older match history in one authenticated place.
                  </p>
                </section>

                <section className="grid gap-3 px-5 py-5 sm:px-6 sm:py-6">
                  <div className="rounded-[16px] border border-white/10 bg-[#05070b] p-4">
                    <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-zinc-100">
                      Active / Recent Matches
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                      Accepted connections show the player summary you matched
                      on plus unlocked Discord and Battle.net profile details.
                    </p>
                    <div className="mt-4 grid gap-3">
                      {recentMatches.length > 0 ? (
                        recentMatches.map((match) => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            acceptedAtLabel={formatDateTime(match.acceptedAt)}
                          />
                        ))
                      ) : (
                        <div className="rounded-[16px] border border-dashed border-white/12 bg-white/[0.02] px-4 py-6">
                          <p className="text-sm font-medium text-zinc-200">
                            No accepted matches yet.
                          </p>
                          <p className="mt-2 text-sm leading-6 text-zinc-500">
                            When an invite gets accepted, the player and their
                            unlocked contact details will show up here.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[16px] border border-white/10 bg-[#05070b] p-4">
                    <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-zinc-100">
                      Pending Sent Invites
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                      Outgoing invites stay here until they are accepted,
                      declined, cancelled, or expired.
                    </p>
                    <div className="mt-4 grid gap-3">
                      {pendingSentInvites.length > 0 ? (
                        pendingSentInvites.map((invite) => (
                          <PendingSentInviteCard
                            key={invite.id}
                            invite={invite}
                            createdAtLabel={formatDateTime(invite.createdAt)}
                            expiresAtLabel={formatDateTime(invite.expiresAt)}
                          />
                        ))
                      ) : (
                        <div className="rounded-[16px] border border-dashed border-white/12 bg-white/[0.02] px-4 py-6">
                          <p className="text-sm font-medium text-zinc-200">
                            No pending invites right now.
                          </p>
                          <p className="mt-2 text-sm leading-6 text-zinc-500">
                            Sent invites will appear here while they wait on a
                            response.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {pastMatches.length > 0 ? (
                    <div className="rounded-[16px] border border-white/10 bg-[#05070b] p-4">
                      <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-zinc-100">
                        Past Matches
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-zinc-500">
                        Older accepted invites stay here so you can revisit who
                        you connected with.
                      </p>
                      <div className="mt-4 grid gap-3">
                        {pastMatches.map((match) => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            acceptedAtLabel={formatDateTime(match.acceptedAt)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {!hasAnyMatches ? (
                    <div className="rounded-[16px] border border-dashed border-white/12 bg-white/[0.02] px-5 py-10 text-center">
                      <p className="text-sm font-medium text-zinc-200">
                        No matches yet.
                      </p>
                      <p className="mt-2 text-sm leading-6 text-zinc-500">
                        Send invites from profile or LFG surfaces once those
                        actions are wired, and accepted connections will collect
                        here automatically.
                      </p>
                    </div>
                  ) : null}
                </section>
              </div>
            </PageReveal>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
