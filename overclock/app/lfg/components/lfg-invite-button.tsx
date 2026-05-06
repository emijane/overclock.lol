"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { sendPlayInvite } from "@/app/matches/actions";
import { getInviteActionPresentation } from "@/lib/matches/invite-action-presentation";
import type {
  InviteViewerState,
  ProfileInviteState,
} from "@/lib/matches/play-invite-types";

type LFGInviteButtonProps = {
  initialState: ProfileInviteState;
  recipientProfileId: string;
  sourceLFGPostId: string;
  viewerState: InviteViewerState;
};

export function LFGInviteButton({
  initialState,
  recipientProfileId,
  sourceLFGPostId,
  viewerState,
}: LFGInviteButtonProps) {
  const [inviteState, setInviteState] = useState<ProfileInviteState>(initialState);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const presentation = getInviteActionPresentation({
    inviteState,
    isPending,
    labels: {
      idle: "Invite to play",
    },
    viewerState,
  });

  if (presentation.href) {
    return (
      <Link
        href={presentation.href}
        className="inline-flex h-8 shrink-0 items-center rounded-full border border-white/10 bg-white/[0.04] px-3 text-[11px] font-semibold text-zinc-100 transition hover:bg-white/[0.08] hover:text-white"
      >
        {presentation.label}
      </Link>
    );
  }

  function handleSendInvite() {
    setFeedback(null);

    startTransition(async () => {
      const result = await sendPlayInvite({
        recipientProfileId,
        sourceLFGPostId,
      });

      if (result.status === "success") {
        setInviteState("invite_sent");
        setFeedback("Invite sent.");
        return;
      }

      if (result.status === "unauthenticated") {
        setFeedback("Your session expired. Sign in again.");
        return;
      }

      if (result.status === "onboarding_required") {
        setFeedback("Finish onboarding before sending invites.");
        return;
      }

      if (result.message.includes("pending invite")) {
        setInviteState("invite_sent");
      }

      setFeedback(result.message);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={!presentation.canSendInvite}
        aria-disabled={!presentation.canSendInvite}
        onClick={handleSendInvite}
        className="inline-flex h-8 shrink-0 items-center rounded-full border border-white/10 bg-white/[0.04] px-3 text-[11px] font-semibold text-zinc-100 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/[0.03] disabled:text-zinc-400"
      >
        {presentation.label}
      </button>
      {feedback ? <p className="max-w-[180px] text-right text-[11px] text-zinc-400">{feedback}</p> : null}
    </div>
  );
}
