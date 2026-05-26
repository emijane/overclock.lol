"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { acceptPlayInvite, declinePlayInvite } from "@/features/matches/actions";
import type { IncomingPendingPlayInvite } from "@/lib/matches/play-invites";
import {
  formatMatchRegion,
  formatMatchRole,
  formatMatchTimestamp,
  getDisplayableMatchMetaLabel,
  type MatchMetaChip,
  MATCH_DESTRUCTIVE_BUTTON_CLASSNAME,
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
  const metadata: MatchMetaChip[] = [];

  const rankLabel = getDisplayableMatchMetaLabel(invite.participant.rankLabel);

  if (rankLabel) {
    metadata.push({ label: rankLabel, tone: "primary" });
  }

  const roleLabel = getDisplayableMatchMetaLabel(
    formatMatchRole(invite.participant.mainRole)
  );

  if (roleLabel) {
    metadata.push({ label: roleLabel, tone: "secondary" });
  }

  const regionLabel = getDisplayableMatchMetaLabel(
    formatMatchRegion(invite.participant.region)
  );

  if (regionLabel) {
    metadata.push({ label: regionLabel, tone: "secondary" });
  }

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
        <div className="flex shrink-0 items-center gap-1.5 rounded-[10px] border border-white/[0.05] bg-white/[0.015] p-1">
          <button
            type="button"
            disabled={isPending}
            aria-disabled={isPending}
            onClick={() => handleInviteAction("accept")}
            className="oc-profile-display inline-flex h-7 items-center rounded-[9px] bg-zinc-100 px-3 text-[10px] font-semibold text-black shadow-[0_10px_20px_rgba(0,0,0,0.16)] transition-all duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-100/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "..." : "Accept"}
          </button>
          <button
            type="button"
            disabled={isPending}
            aria-disabled={isPending}
            onClick={() => handleInviteAction("decline")}
            className={MATCH_DESTRUCTIVE_BUTTON_CLASSNAME}
          >
            {isPending ? "..." : "Decline"}
          </button>
        </div>
      }
      footer={
        <div className="space-y-2">
          {invite.message ?? invite.sourcePostTitle ? (
            <p className="oc-profile-meta line-clamp-2 text-[10px] leading-[1.125rem] text-zinc-400">
              {invite.message ?? invite.sourcePostTitle}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {expiresLabel ? (
              <span className="oc-profile-meta text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                {expiresLabel}
              </span>
            ) : null}
            {feedback ? (
              <span className="oc-profile-meta text-[10px] text-rose-300">{feedback}</span>
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
