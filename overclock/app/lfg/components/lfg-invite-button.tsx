"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { sendPlayInvite } from "@/app/matches/actions";
import type { ProfileInviteState } from "@/lib/matches/play-invites";

type LFGInviteButtonProps = {
  initialState: ProfileInviteState;
  recipientProfileId: string;
  sourceLFGPostId: string;
  viewerState: "guest" | "signed_in";
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

  if (viewerState === "guest") {
    return (
      <Link
        href="/login?type=error&message=Sign%20in%20to%20send%20play%20invites."
        className="inline-flex h-8 shrink-0 items-center rounded-full border border-white/10 bg-white/[0.04] px-3 text-[11px] font-semibold text-zinc-100 transition hover:bg-white/[0.08] hover:text-white"
      >
        Sign in to invite
      </Link>
    );
  }

  const isDisabled = isPending || inviteState !== "invite_to_play";
  const buttonLabel =
    inviteState === "invite_sent"
      ? "Invite Sent"
      : inviteState === "matched"
        ? "Matched"
        : isPending
          ? "Sending..."
          : "Invite to play";

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
        disabled={isDisabled}
        aria-disabled={isDisabled}
        onClick={handleSendInvite}
        className="inline-flex h-8 shrink-0 items-center rounded-full border border-white/10 bg-white/[0.04] px-3 text-[11px] font-semibold text-zinc-100 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/[0.03] disabled:text-zinc-400"
      >
        {buttonLabel}
      </button>
      {feedback ? <p className="max-w-[180px] text-right text-[11px] text-zinc-400">{feedback}</p> : null}
    </div>
  );
}
