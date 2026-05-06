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
  onInviteSent?: (profileId: string) => void;
  recipientProfileId: string;
  sourceLFGPostId: string;
  viewerState: InviteViewerState;
};

export function LFGInviteButton({
  initialState,
  onInviteSent,
  recipientProfileId,
  sourceLFGPostId,
  viewerState,
}: LFGInviteButtonProps) {
  const [inviteState, setInviteState] = useState<ProfileInviteState>(initialState);
  const [isPending, startTransition] = useTransition();
  const presentation = getInviteActionPresentation({
    inviteState,
    isPending,
    labels: {
      idle: "Connect",
    },
    viewerState,
  });

  if (presentation.href) {
    return (
      <Link
        href={presentation.href}
        className="inline-flex h-7 shrink-0 items-center rounded-full border border-sky-400/30 bg-sky-400/10 px-3 text-[11px] font-semibold text-sky-200 transition hover:bg-sky-400/15"
      >
        {presentation.label}
      </Link>
    );
  }

  function handleSendInvite() {
    startTransition(async () => {
      const result = await sendPlayInvite({
        recipientProfileId,
        sourceLFGPostId,
      });

      if (result.status === "success" || result.message?.includes("pending invite")) {
        setInviteState("invite_sent");
        onInviteSent?.(recipientProfileId);
        return;
      }
    });
  }

  if (inviteState === "connected") {
    return (
      <span className="inline-flex h-7 shrink-0 items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 text-[11px] font-semibold text-emerald-300">
        Connected
      </span>
    );
  }

  if (inviteState === "invite_sent") {
    return (
      <span className="inline-flex h-7 shrink-0 items-center rounded-full border border-white/8 bg-white/4 px-3 text-[11px] font-semibold text-zinc-500">
        Invited
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending || !presentation.canSendInvite}
      aria-disabled={isPending || !presentation.canSendInvite}
      onClick={handleSendInvite}
      className="inline-flex h-7 shrink-0 cursor-pointer items-center rounded-full border border-sky-400/30 bg-sky-400/10 px-3 text-[11px] font-semibold text-sky-200 transition hover:bg-sky-400/15 disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/4 disabled:text-zinc-500"
    >
      {isPending ? "..." : presentation.label}
    </button>
  );
}
