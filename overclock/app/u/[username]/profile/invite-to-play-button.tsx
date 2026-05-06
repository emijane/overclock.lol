"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { cancelPlayInvite, removeProfileConnection, sendPlayInvite } from "@/app/matches/actions";
import { getInviteActionPresentation } from "@/lib/matches/invite-action-presentation";
import type {
  InviteViewerState,
  ProfileInviteState,
} from "@/lib/matches/play-invite-types";

type InviteToPlayButtonProps = {
  activeConnectionId: string | null;
  initialInviteId: string | null;
  initialState: ProfileInviteState;
  recipientProfileId: string;
  viewerState: InviteViewerState;
};

export function InviteToPlayButton({
  activeConnectionId,
  initialInviteId,
  initialState,
  recipientProfileId,
  viewerState,
}: InviteToPlayButtonProps) {
  const [inviteState, setInviteState] = useState<ProfileInviteState>(initialState);
  const [inviteId, setInviteId] = useState<string | null>(initialInviteId);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const presentation = getInviteActionPresentation({
    inviteState,
    isPending,
    labels: { idle: "Connect" },
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
      const result = await sendPlayInvite({ recipientProfileId });

      if (result.status === "success") {
        setInviteId(result.inviteId);
        setInviteState("invite_sent");
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
        return;
      }

      setFeedback(result.message);
    });
  }

  function handleCancelInvite() {
    if (!inviteId) return;
    setFeedback(null);

    startTransition(async () => {
      const result = await cancelPlayInvite({ inviteId });

      if (result.status === "success") {
        setInviteId(null);
        setInviteState("invite_to_play");
        return;
      }

      if (result.status === "unauthenticated") {
        setFeedback("Your session expired. Sign in again.");
        return;
      }

      if (result.status === "onboarding_required") {
        setFeedback("Finish onboarding before updating invites.");
        return;
      }

      setFeedback(result.message);
    });
  }

  function handleRemoveConnection() {
    if (!activeConnectionId) return;
    setFeedback(null);

    startTransition(async () => {
      const result = await removeProfileConnection({ connectionId: activeConnectionId });

      if (result.status === "success") {
        setInviteState("invite_to_play");
        return;
      }

      if (result.status === "unauthenticated") {
        setFeedback("Your session expired. Sign in again.");
        return;
      }

      if (result.status === "onboarding_required") {
        setFeedback("Finish onboarding before updating connections.");
        return;
      }

      setFeedback(result.message);
    });
  }

  if (inviteState === "connected") {
    return (
      <div className="flex flex-col items-start gap-2">
        <button
          type="button"
          disabled={isPending || !activeConnectionId}
          aria-disabled={isPending || !activeConnectionId}
          onClick={handleRemoveConnection}
          className="inline-flex h-8 items-center rounded-full border border-rose-400/20 bg-rose-500/10 px-3 text-xs font-medium text-rose-200 transition-all duration-200 hover:bg-rose-500/15 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Removing..." : "Remove connection"}
        </button>
        {feedback ? <p className="max-w-[220px] text-xs text-rose-300">{feedback}</p> : null}
      </div>
    );
  }

  if (inviteState === "invite_sent") {
    return (
      <div className="flex flex-col items-start gap-2">
        <button
          type="button"
          disabled={isPending || !inviteId}
          aria-disabled={isPending || !inviteId}
          onClick={handleCancelInvite}
          className="inline-flex h-8 items-center rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-zinc-400 backdrop-blur-md transition-all duration-200 hover:border-rose-400/20 hover:bg-rose-500/10 hover:text-rose-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Removing..." : "Invite Sent"}
        </button>
        {feedback ? <p className="max-w-[220px] text-xs text-zinc-400">{feedback}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={!presentation.canSendInvite}
        aria-disabled={!presentation.canSendInvite}
        onClick={handleSendInvite}
        className="inline-flex h-8 items-center rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-zinc-100 backdrop-blur-md transition-all duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 cursor-pointer disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/[0.04] disabled:text-zinc-400"
      >
        {presentation.label}
      </button>
      {feedback ? <p className="max-w-[220px] text-xs text-zinc-400">{feedback}</p> : null}
    </div>
  );
}
