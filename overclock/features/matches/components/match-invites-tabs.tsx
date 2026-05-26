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
    <div className="oc-surface-panel overflow-hidden rounded-[22px]">
      <div className="flex flex-col gap-3 border-b border-white/6 px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="oc-profile-meta text-[11px] font-semibold uppercase tracking-[0.18em]">
              Invite inbox
            </p>
            <h2 className="oc-profile-display mt-1 text-[15px] font-semibold tracking-[-0.02em] text-zinc-100">
              Pending invites
            </h2>
          </div>
          <span className="oc-profile-meta inline-flex min-w-8 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-zinc-300">
            {incomingInvites.length + outgoingInvites.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("incoming")}
            className={`oc-profile-display inline-flex h-8 items-center rounded-full border px-3 text-[12px] font-semibold tracking-[-0.02em] transition ${
              activeTab === "incoming"
                ? "border-white/10 bg-white/[0.08] text-zinc-100"
                : "border-white/8 bg-white/[0.03] text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Incoming
            <span className="oc-profile-meta ml-1.5 tabular-nums text-[11px] text-zinc-400">
              {incomingInvites.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("outgoing")}
            className={`oc-profile-display inline-flex h-8 items-center rounded-full border px-3 text-[12px] font-semibold tracking-[-0.02em] transition ${
              activeTab === "outgoing"
                ? "border-white/10 bg-white/[0.08] text-zinc-100"
                : "border-white/8 bg-white/[0.03] text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Outgoing
            <span className="oc-profile-meta ml-1.5 tabular-nums text-[11px] text-zinc-400">
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
        <div className="px-5 py-8 text-center">
          <p className="oc-profile-display text-sm font-medium tracking-[-0.01em] text-zinc-200">
            {activeTab === "incoming" ? "No incoming invites" : "No outgoing invites"}
          </p>
          <p className="oc-profile-meta mt-1 text-sm">
            {activeTab === "incoming" ? "No incoming invites." : "No outgoing invites."}
          </p>
        </div>
      )}
    </div>
  );
}
