"use client";

import { useState } from "react";
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

type ConnectionsTab = "active" | "pending";

export function MatchesPageView({ dto }: MatchesPageViewProps) {
  const connections = dto.connections;
  const pendingSentInvites = dto.outgoingInvites;
  const incomingPendingInvites = dto.incomingInvites;
  const pendingConnectionsCount =
    pendingSentInvites.length + incomingPendingInvites.length;
  const [activeTab, setActiveTab] = useState<ConnectionsTab>(
    pendingConnectionsCount > 0 ? "pending" : "active"
  );

  return (
    <DarkPageShell
      className="oc-atmosphere-bg py-6 sm:py-8"
      containerClassName="flex flex-col gap-2.5"
      maxWidthClassName="max-w-none"
      variant="matches"
    >
      <section className="mx-auto w-full max-w-[56rem] rounded-[16px] sm:max-w-[58rem]">
        <div className="overflow-hidden rounded-[16px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.018)_0%,rgba(255,255,255,0.008)_28%,rgba(7,7,9,0.96)_100%)] shadow-[0_16px_36px_rgba(0,0,0,0.22)] sm:rounded-[10px] sm:border-0 sm:bg-[linear-gradient(180deg,rgba(255,255,255,0.012)_0%,rgba(255,255,255,0.006)_100%)] sm:shadow-none">
          <PageReveal>
            <header className="px-5 py-2.5 sm:px-6 sm:py-3.5">
              <div className="space-y-2">
                <Link
                  href="/account"
                  className="oc-profile-meta inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:text-zinc-300"
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5 shrink-0" />
                  Account
                </Link>
                <div className="space-y-1.5">
                  <h1 className="oc-profile-display text-[22px] font-bold tracking-[-0.04em] text-zinc-50 sm:text-[26px]">
                    Connections
                  </h1>
                  <p className="oc-profile-meta max-w-xl text-[11px] leading-5 text-zinc-500 sm:text-[12px]">
                    Keep invites moving and manage the players already in your orbit.
                  </p>
                </div>
              </div>
            </header>
          </PageReveal>

          <PageReveal delay={1}>
            <section className="grid gap-2 px-5 pb-5 pt-1.5 sm:px-6 sm:pb-6 sm:pt-2">
              <div className="overflow-hidden rounded-[12px] border border-white/[0.06] bg-white/[0.02]">
                <div className="flex flex-col gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
                  <div className="space-y-1">
                    <p className="oc-profile-meta text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                      Network
                    </p>
                    <h2 className="oc-profile-display text-[15px] font-semibold tracking-[-0.03em] text-zinc-100">
                      {activeTab === "active"
                        ? "Active connections"
                        : "Pending connections"}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("active")}
                      className={`oc-profile-display inline-flex h-9 items-center rounded-[10px] border px-3.5 text-[12px] font-semibold tracking-[-0.02em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-100/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
                        activeTab === "active"
                          ? "border-zinc-100/90 bg-zinc-100 text-black shadow-[0_12px_24px_rgba(0,0,0,0.18)]"
                          : "border-white/[0.05] bg-transparent text-zinc-500 hover:border-white/[0.08] hover:bg-white/[0.02] hover:text-zinc-300"
                      }`}
                    >
                      Active
                      <span
                        className={`oc-profile-meta ml-1.5 tabular-nums text-[11px] ${
                          activeTab === "active" ? "text-black/65" : "text-zinc-400"
                        }`}
                      >
                        {connections.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("pending")}
                      className={`oc-profile-display inline-flex h-9 items-center rounded-[10px] border px-3.5 text-[12px] font-semibold tracking-[-0.02em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-100/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
                        activeTab === "pending"
                          ? "border-zinc-100/90 bg-zinc-100 text-black shadow-[0_12px_24px_rgba(0,0,0,0.18)]"
                          : "border-white/[0.05] bg-transparent text-zinc-500 hover:border-white/[0.08] hover:bg-white/[0.02] hover:text-zinc-300"
                      }`}
                    >
                      Pending
                      <span
                        className={`oc-profile-meta ml-1.5 tabular-nums text-[11px] ${
                          activeTab === "pending" ? "text-black/65" : "text-zinc-400"
                        }`}
                      >
                        {pendingConnectionsCount}
                      </span>
                    </button>
                  </div>
                </div>

                {activeTab === "pending" ? (
                  <MatchInvitesTabs
                    incomingInvites={incomingPendingInvites}
                    outgoingInvites={pendingSentInvites}
                  />
                ) : connections.length > 0 ? (
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
                  <div className="grid min-h-[280px] place-items-center px-5 py-10 text-center">
                    <div className="max-w-sm space-y-2">
                      <p className="oc-profile-meta text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                        Active network
                      </p>
                      <p className="oc-profile-display text-sm font-medium tracking-[-0.01em] text-zinc-200">
                        No connections yet
                      </p>
                      <p className="oc-profile-meta text-[11px] leading-5">
                        Accepted invites will show up here once you match with someone.
                      </p>
                    </div>
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
