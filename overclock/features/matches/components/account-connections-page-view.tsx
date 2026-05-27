"use client";

import { useState } from "react";

import { MatchCard } from "@/features/matches/components/match-card";
import { MatchInvitesTabs } from "@/features/matches/components/match-invites-tabs";
import type { MatchesPageDto } from "@/lib/pages/matches-page-dto";

type AccountConnectionsPageViewProps = {
  dto: MatchesPageDto;
};

type ConnectionsTab = "active" | "pending";

export function AccountConnectionsPageView({
  dto,
}: AccountConnectionsPageViewProps) {
  const connections = dto.connections;
  const pendingSentInvites = dto.outgoingInvites;
  const incomingPendingInvites = dto.incomingInvites;
  const pendingConnectionsCount =
    pendingSentInvites.length + incomingPendingInvites.length;
  const [activeTab, setActiveTab] = useState<ConnectionsTab>(
    pendingConnectionsCount > 0 ? "pending" : "active"
  );

  return (
    <>
      <div className="flex shrink-0 items-center justify-between px-5 py-3 sm:px-6">
        <h1 className="oc-profile-display text-[18px] font-bold tracking-[-0.03em] text-zinc-50">
          Connections
        </h1>
      </div>

      <div className="border-t border-white/5" />

      <div className="px-5 py-4 sm:px-6">
        <section className="overflow-hidden rounded-[14px] border border-white/[0.06] bg-white/[0.02]">
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

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("active")}
                className={`inline-flex h-7 items-center gap-1.5 rounded-[10px] border px-2.5 font-mono text-[11px] font-medium transition ${
                  activeTab === "active"
                    ? "border-white/10 bg-white/[0.07] text-zinc-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    : "border-white/6 bg-white/3 text-zinc-500 hover:border-white/10 hover:bg-white/6 hover:text-zinc-300"
                }`}
              >
                Active
                <span
                  className={`tabular-nums ${
                    activeTab === "active" ? "text-zinc-400" : "text-zinc-600"
                  }`}
                >
                  {connections.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pending")}
                className={`inline-flex h-7 items-center gap-1.5 rounded-[10px] border px-2.5 font-mono text-[11px] font-medium transition ${
                  activeTab === "pending"
                    ? "border-white/10 bg-white/[0.07] text-zinc-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    : "border-white/6 bg-white/3 text-zinc-500 hover:border-white/10 hover:bg-white/6 hover:text-zinc-300"
                }`}
              >
                Pending
                <span
                  className={`tabular-nums ${
                    activeTab === "pending" ? "text-zinc-400" : "text-zinc-600"
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
            <ul>
              {connections.map((connection, index) => (
                <li
                  key={connection.id}
                  className={
                    index < connections.length - 1
                      ? "border-b border-white/[0.06]"
                      : ""
                  }
                >
                  <MatchCard connection={connection} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid min-h-[240px] place-items-center px-5 py-10 text-center">
              <div className="max-w-sm space-y-2">
                <p className="oc-profile-meta text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                  Active network
                </p>
                <p className="oc-profile-display text-sm font-medium tracking-[-0.01em] text-zinc-200">
                  No connections yet
                </p>
                <p className="oc-profile-meta text-[11px] leading-5">
                  Accepted invites will show up here once you match with
                  someone.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
