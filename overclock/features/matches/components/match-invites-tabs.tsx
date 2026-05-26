"use client";

import { useState } from "react";

import type {
  IncomingPendingPlayInvite,
  PendingSentPlayInvite,
} from "@/lib/matches/play-invites";
import { IncomingPendingInviteCard } from "./incoming-pending-invite-card";
import { PendingSentInviteCard } from "./pending-sent-invite-card";

type MatchInvitesTabsProps = {
  incomingInvites: IncomingPendingPlayInvite[];
  outgoingInvites: PendingSentPlayInvite[];
};

type InviteTab = "incoming" | "outgoing";

export function MatchInvitesTabs({
  incomingInvites,
  outgoingInvites,
}: MatchInvitesTabsProps) {
  const [activeTab, setActiveTab] = useState<InviteTab>(
    incomingInvites.length > 0 ? "incoming" : "outgoing"
  );
  const visibleInvites = activeTab === "incoming" ? incomingInvites : outgoingInvites;

  return (
    <div>
      <div className="flex flex-col gap-2 border-b border-white/[0.06] px-4 py-4 sm:px-5">
        <p className="oc-profile-meta text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
          Invite type
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("incoming")}
            className={`inline-flex h-7 items-center rounded-[10px] border px-2.5 text-[11px] font-medium transition-all duration-200 ${
              activeTab === "incoming"
                ? "border-white/[0.06] bg-white/[0.03] text-zinc-200"
                : "border-white/[0.04] bg-transparent text-zinc-500 hover:border-white/[0.06] hover:bg-white/[0.02] hover:text-zinc-300"
            }`}
          >
            Incoming
            <span className="oc-profile-meta ml-1.25 tabular-nums text-[10px] text-zinc-500">
              {incomingInvites.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("outgoing")}
            className={`inline-flex h-7 items-center rounded-[10px] border px-2.5 text-[11px] font-medium transition-all duration-200 ${
              activeTab === "outgoing"
                ? "border-white/[0.06] bg-white/[0.03] text-zinc-200"
                : "border-white/[0.04] bg-transparent text-zinc-500 hover:border-white/[0.06] hover:bg-white/[0.02] hover:text-zinc-300"
            }`}
          >
            Outgoing
            <span className="oc-profile-meta ml-1.25 tabular-nums text-[10px] text-zinc-500">
              {outgoingInvites.length}
            </span>
          </button>
        </div>
      </div>

      {visibleInvites.length > 0 ? (
        <ul>
          {visibleInvites.map((invite, index) => (
            <li
              key={invite.id}
              className={index < visibleInvites.length - 1 ? "border-b border-white/[0.06]" : ""}
            >
              {activeTab === "incoming" ? (
                <IncomingPendingInviteCard invite={invite as IncomingPendingPlayInvite} />
              ) : (
                <PendingSentInviteCard invite={invite as PendingSentPlayInvite} />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid min-h-[240px] place-items-center px-5 py-10 text-center">
          <p className="oc-profile-display text-sm font-medium tracking-[-0.01em] text-zinc-200">
            {activeTab === "incoming" ? "No incoming invites" : "No outgoing invites"}
          </p>
          <p className="oc-profile-meta mt-2 text-[11px] leading-5">
            {activeTab === "incoming" ? "No incoming invites." : "No outgoing invites."}
          </p>
        </div>
      )}
    </div>
  );
}
