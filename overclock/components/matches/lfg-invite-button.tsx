"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { sendPlayInvite } from "@/features/matches/actions";
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
  tone?: "default" | "duos";
  viewerState: InviteViewerState;
};

export function LFGInviteButton({
  initialState,
  onInviteSent,
  recipientProfileId,
  sourceLFGPostId,
  tone = "default",
  viewerState,
}: LFGInviteButtonProps) {
  const [inviteState, setInviteState] = useState<ProfileInviteState>(initialState);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
        className={`inline-flex h-7 shrink-0 items-center rounded-[10px] px-3 transition ${
          tone === "duos"
            ? "oc-profile-display border border-white/[0.06] bg-white/[0.03] text-[11px] font-semibold text-zinc-200 hover:border-white/[0.12] hover:bg-white/[0.06]"
            : "border border-sky-400/30 bg-sky-400/10 text-[11px] font-semibold text-sky-200 hover:bg-sky-400/15"
        }`}
      >
        {presentation.label}
      </Link>
    );
  }

  function handleSendInvite() {
    startTransition(async () => {
      setErrorMessage(null);
      const result = await sendPlayInvite({
        recipientProfileId,
        sourceLFGPostId,
      });

      if (
        result.status === "success" ||
        (result.status === "error" && result.message.includes("pending invite"))
      ) {
        setInviteState("invite_sent");
        onInviteSent?.(recipientProfileId);
        return;
      }

      setErrorMessage(
        result.status === "error" ? result.message : "This action is unavailable."
      );
    });
  }

  if (inviteState === "connected") {
    return (
      <span
        className={`inline-flex h-7 shrink-0 items-center rounded-full px-3 ${
          tone === "duos"
            ? "oc-profile-meta border border-white/[0.06] bg-white/[0.03] text-[11px] font-semibold text-zinc-300"
            : "border border-emerald-400/20 bg-emerald-500/10 text-[11px] font-semibold text-emerald-300"
        }`}
      >
        Connected
      </span>
    );
  }

  if (inviteState === "invite_sent") {
    return (
      <span className="oc-profile-meta inline-flex h-7 shrink-0 items-center rounded-full border border-white/[0.06] bg-white/[0.03] px-3 text-[11px] font-semibold text-zinc-500">
        Invited
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending || !presentation.canSendInvite}
        aria-disabled={isPending || !presentation.canSendInvite}
        onClick={handleSendInvite}
        className={`inline-flex h-7 shrink-0 cursor-pointer items-center rounded-[10px] px-3 transition disabled:cursor-not-allowed disabled:text-zinc-500 ${
          tone === "duos"
            ? "oc-profile-display border border-white/[0.06] bg-white/[0.03] text-[11px] font-semibold text-zinc-200 hover:border-white/[0.12] hover:bg-white/[0.06] disabled:border-white/[0.06] disabled:bg-white/[0.03]"
            : "border border-sky-400/30 bg-sky-400/10 text-[11px] font-semibold text-sky-200 hover:bg-sky-400/15 disabled:border-white/8 disabled:bg-white/4"
        }`}
      >
        {isPending ? "..." : presentation.label}
      </button>
      {errorMessage ? (
        <p className={`${tone === "duos" ? "oc-profile-meta text-rose-300" : "text-red-400"} text-[10px]`}>
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
