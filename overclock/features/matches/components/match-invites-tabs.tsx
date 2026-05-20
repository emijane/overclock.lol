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
    <div className="overflow-hidden rounded-[12px] border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center gap-1 border-b border-white/[0.06] px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={() => setActiveTab("incoming")}
          className={`oc-profile-display inline-flex h-8 cursor-pointer items-center rounded-[10px] px-3 text-[13px] font-semibold tracking-[-0.02em] transition ${
            activeTab === "incoming"
              ? "bg-white/[0.08] text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Incoming
          {incomingInvites.length > 0 ? (
            <span className="oc-profile-meta ml-1.5 tabular-nums text-zinc-400">{incomingInvites.length}</span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("outgoing")}
          className={`oc-profile-display inline-flex h-8 cursor-pointer items-center rounded-[10px] px-3 text-[13px] font-semibold tracking-[-0.02em] transition ${
            activeTab === "outgoing"
              ? "bg-white/[0.08] text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Outgoing
          {outgoingInvites.length > 0 ? (
            <span className="oc-profile-meta ml-1.5 tabular-nums text-zinc-400">{outgoingInvites.length}</span>
          ) : null}
        </button>
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
        <div className="px-5 py-7 text-center">
          <p className="oc-profile-meta text-sm">
            {activeTab === "incoming" ? "No incoming invites." : "No outgoing invites."}
          </p>
        </div>
      )}
    </div>
  );
}
