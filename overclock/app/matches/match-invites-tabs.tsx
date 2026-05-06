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
    <div className="overflow-hidden rounded-[22px] border border-white/8 bg-[#05070b] shadow-[0_24px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center gap-1 border-b border-white/6 px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={() => setActiveTab("incoming")}
          className={`inline-flex h-8 items-center rounded-full px-3 text-sm font-semibold transition ${
            activeTab === "incoming"
              ? "bg-white/8 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Incoming
          {incomingInvites.length > 0 ? (
            <span className="ml-1.5 tabular-nums text-zinc-400">{incomingInvites.length}</span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("outgoing")}
          className={`inline-flex h-8 items-center rounded-full px-3 text-sm font-semibold transition ${
            activeTab === "outgoing"
              ? "bg-white/8 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Outgoing
          {outgoingInvites.length > 0 ? (
            <span className="ml-1.5 tabular-nums text-zinc-400">{outgoingInvites.length}</span>
          ) : null}
        </button>
      </div>

      {visibleInvites.length > 0 ? (
        <ul>
          {visibleInvites.map((invite, index) => (
            <li
              key={invite.id}
              className={index < visibleInvites.length - 1 ? "border-b border-white/6" : ""}
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
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-zinc-500">
            {activeTab === "incoming" ? "No incoming invites." : "No outgoing invites."}
          </p>
        </div>
      )}
    </div>
  );
}
