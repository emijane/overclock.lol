"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { sendPlayInvite } from "@/app/matches/actions";
import { getInviteActionPresentation } from "@/lib/matches/invite-action-presentation";
import type {
  InviteViewerState,
  ProfileInviteState,
} from "@/lib/matches/play-invite-types";

type InviteToPlayButtonProps = {
  initialState: ProfileInviteState;
  recipientProfileId: string;
  viewerState: InviteViewerState;
};

export function InviteToPlayButton({
  initialState,
  recipientProfileId,
  viewerState,
}: InviteToPlayButtonProps) {
  const [inviteState, setInviteState] = useState<ProfileInviteState>(initialState);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const presentation = getInviteActionPresentation({
    inviteState,
    isPending,
    viewerState,
  });

  if (presentation.href) {
    return (
      <Link
        href={presentation.href}
        className="inline-flex h-8 items-center rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-zinc-100 backdrop-blur-md transition-all duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
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
        disabled={!presentation.canSendInvite}
        aria-disabled={!presentation.canSendInvite}
        onClick={handleSendInvite}
        className="inline-flex h-8 items-center rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-zinc-100 backdrop-blur-md transition-all duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/[0.04] disabled:text-zinc-400"
      >
        {presentation.label}
      </button>
      {feedback ? <p className="max-w-[220px] text-xs text-zinc-400">{feedback}</p> : null}
    </div>
  );
}
