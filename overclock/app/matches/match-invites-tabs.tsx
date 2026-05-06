"use client";

import { useState } from "react";

import type {
  IncomingPendingPlayInvite,
  PendingSentPlayInvite,
} from "@/lib/matches/play-invites";
import { IncomingPendingInviteCard } from "./incoming-pending-invite-card";
import { PendingSentInviteCard } from "./pending-sent-invite-card";

type MatchInvitesTabsProps = {
  incomingInvites: Array<{
    createdAtLabel: string;
    expiresAtLabel: string;
    invite: IncomingPendingPlayInvite;
  }>;
  outgoingInvites: Array<{
    createdAtLabel: string;
    expiresAtLabel: string;
    invite: PendingSentPlayInvite;
  }>;
};

type InviteTab = "incoming" | "outgoing";

function tabClassName(isActive: boolean) {
  return `inline-flex h-9 items-center rounded-full px-3.5 text-sm font-semibold transition ${
    isActive
      ? "bg-zinc-100 text-black"
      : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
  }`;
}

export function MatchInvitesTabs({
  incomingInvites,
  outgoingInvites,
}: MatchInvitesTabsProps) {
  const [activeTab, setActiveTab] = useState<InviteTab>(
    incomingInvites.length > 0 ? "incoming" : "outgoing"
  );
  const visibleInvites = activeTab === "incoming" ? incomingInvites : outgoingInvites;

  return (
    <section className="rounded-[22px] border border-white/[0.08] bg-[#05070b] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-5">
      <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.02] p-1">
        <button
          type="button"
          onClick={() => setActiveTab("incoming")}
          className={tabClassName(activeTab === "incoming")}
        >
          Incoming
          {incomingInvites.length > 0 ? ` (${incomingInvites.length})` : ""}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("outgoing")}
          className={tabClassName(activeTab === "outgoing")}
        >
          Outgoing
          {outgoingInvites.length > 0 ? ` (${outgoingInvites.length})` : ""}
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        {visibleInvites.length > 0 ? (
          activeTab === "incoming" ? (
            incomingInvites.map((invite) => (
              <IncomingPendingInviteCard
                key={invite.invite.id}
                invite={invite.invite}
                createdAtLabel={invite.createdAtLabel}
                expiresAtLabel={invite.expiresAtLabel}
              />
            ))
          ) : (
            outgoingInvites.map((invite) => (
              <PendingSentInviteCard
                key={invite.invite.id}
                invite={invite.invite}
                createdAtLabel={invite.createdAtLabel}
                expiresAtLabel={invite.expiresAtLabel}
              />
            ))
          )
        ) : (
          <div className="rounded-[16px] border border-dashed border-white/12 bg-white/[0.02] px-4 py-6">
            <p className="text-sm font-medium text-zinc-200">
              {activeTab === "incoming"
                ? "No incoming invites right now."
                : "No outgoing invites right now."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
