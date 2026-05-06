"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { sendPlayInvite } from "@/app/matches/actions";
import type { ProfileInviteState } from "@/lib/matches/play-invites";

type InviteToPlayButtonProps = {
  initialState: ProfileInviteState;
  recipientProfileId: string;
  viewerState: "guest" | "signed_in";
};

export function InviteToPlayButton({
  initialState,
  recipientProfileId,
  viewerState,
}: InviteToPlayButtonProps) {
  const [inviteState, setInviteState] = useState<ProfileInviteState>(initialState);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (viewerState === "guest") {
    return (
      <Link
        href="/login?type=error&message=Sign%20in%20to%20send%20play%20invites."
        className="inline-flex h-8 items-center rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-zinc-100 backdrop-blur-md transition-all duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
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
          : "Invite to Play";

  function handleSendInvite() {
    setFeedback(null);

    startTransition(async () => {
      const result = await sendPlayInvite({
        recipientProfileId,
      });

      if (result.status === "success") {
        setInviteState("invite_sent");
        setFeedback("Invite sent. You can track it from Matches.");
        return;
      }

      if (result.status === "unauthenticated") {
        setFeedback("Your session expired. Sign in again to send invites.");
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
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={isDisabled}
        aria-disabled={isDisabled}
        onClick={handleSendInvite}
        className="inline-flex h-8 items-center rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-zinc-100 backdrop-blur-md transition-all duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/[0.04] disabled:text-zinc-400"
      >
        {buttonLabel}
      </button>
      {feedback ? <p className="max-w-[220px] text-xs text-zinc-400">{feedback}</p> : null}
    </div>
  );
}
