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
      containerClassName="flex flex-col gap-3"
      maxWidthClassName="max-w-4xl"
      variant="matches"
    >
      <section className="rounded-[28px]">
        <div className="overflow-hidden rounded-[28px]">
          <PageReveal>
            <header className="py-4 sm:py-5">
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
            </header>
          </PageReveal>

          <PageReveal delay={1}>
            <section className="grid gap-3">
              <div className="oc-surface-panel overflow-hidden rounded-[22px]">
                <div className="flex flex-col gap-3 border-b border-white/6 px-4 py-4 sm:px-5">
                  <div>
                    <p className="oc-profile-meta text-[11px] font-semibold uppercase tracking-[0.18em]">
                      Network
                    </p>
                    <h2 className="oc-profile-display mt-1 text-[15px] font-semibold tracking-[-0.02em] text-zinc-100">
                      {activeTab === "active"
                        ? "Active connections"
                        : "Pending connections"}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("active")}
                      className={`oc-profile-display inline-flex h-8 items-center rounded-[10px] border px-3 text-[12px] font-semibold tracking-[-0.02em] transition ${
                        activeTab === "active"
                          ? "border-white/10 bg-white/[0.08] text-zinc-100"
                          : "border-white/8 bg-white/[0.03] text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Active
                      <span className="oc-profile-meta ml-1.5 tabular-nums text-[11px] text-zinc-400">
                        {connections.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("pending")}
                      className={`oc-profile-display inline-flex h-8 items-center rounded-[10px] border px-3 text-[12px] font-semibold tracking-[-0.02em] transition ${
                        activeTab === "pending"
                          ? "border-white/10 bg-white/[0.08] text-zinc-100"
                          : "border-white/8 bg-white/[0.03] text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Pending
                      <span className="oc-profile-meta ml-1.5 tabular-nums text-[11px] text-zinc-400">
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
