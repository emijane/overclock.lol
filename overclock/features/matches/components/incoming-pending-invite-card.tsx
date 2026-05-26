"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { acceptPlayInvite, declinePlayInvite } from "@/features/matches/actions";
import type { IncomingPendingPlayInvite } from "@/lib/matches/play-invites";
import {
  formatMatchRegion,
  formatMatchRole,
  formatMatchTimestamp,
  MatchRowIdentity,
} from "./match-row-shared";

type IncomingPendingInviteCardProps = {
  invite: IncomingPendingPlayInvite;
};

export function IncomingPendingInviteCard({ invite }: IncomingPendingInviteCardProps) {
  const router = useRouter();
  const participantHref = invite.participant.username
    ? `/u/${invite.participant.username}`
    : null;
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const metadata = [
    invite.participant.rankLabel,
    formatMatchRole(invite.participant.mainRole),
    formatMatchRegion(invite.participant.region),
  ].filter((value): value is string => Boolean(value));
  const expiresLabel = formatMatchTimestamp("Expires", invite.expiresAt);

  function handleInviteAction(action: "accept" | "decline") {
    setFeedback(null);

    startTransition(async () => {
      const result =
        action === "accept"
          ? await acceptPlayInvite({ inviteId: invite.id })
          : await declinePlayInvite({ inviteId: invite.id });

      if (result.status === "success") {
        router.refresh();
        return;
      }

      if (result.status === "unauthenticated") {
        setFeedback("Your session expired. Refresh and sign in again.");
        return;
      }

      if (result.status === "onboarding_required") {
        setFeedback("Finish onboarding before updating invites.");
        return;
      }

      setFeedback(result.message);
    });
  }

  return (
    <MatchRowIdentity
      action={
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            aria-disabled={isPending}
            onClick={() => handleInviteAction("accept")}
            className="oc-profile-display inline-flex h-8 items-center rounded-full bg-zinc-100 px-3.5 text-[11px] font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "..." : "Accept"}
          </button>
          <button
            type="button"
            disabled={isPending}
            aria-disabled={isPending}
            onClick={() => handleInviteAction("decline")}
            className="oc-profile-meta inline-flex h-8 items-center rounded-full border border-white/8 bg-white/[0.03] px-3 text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-300 transition hover:border-white/12 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "..." : "Decline"}
          </button>
        </div>
      }
      footer={
        <div className="space-y-1">
          {invite.message ?? invite.sourcePostTitle ? (
            <p className="oc-profile-meta truncate text-[11px] text-zinc-400">
              {invite.message ?? invite.sourcePostTitle}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {expiresLabel ? <span className="oc-profile-meta text-[11px]">{expiresLabel}</span> : null}
            {feedback ? (
              <span className="oc-profile-meta text-[11px] text-rose-300">{feedback}</span>
            ) : null}
          </div>
        </div>
      }
      href={participantHref}
      participant={invite.participant}
      primaryMeta={metadata}
    />
  );
}
