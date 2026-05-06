"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { acceptPlayInvite, declinePlayInvite } from "@/app/matches/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { IncomingPendingPlayInvite } from "@/lib/matches/play-invites";

type IncomingPendingInviteCardProps = {
  invite: IncomingPendingPlayInvite;
};

function getAvatarFallback(name: string | null, username: string | null) {
  const fallbackSource = name ?? username ?? "P";
  return fallbackSource.slice(0, 1).toUpperCase();
}

export function IncomingPendingInviteCard({ invite }: IncomingPendingInviteCardProps) {
  const router = useRouter();
  const participantHref = invite.participant.username
    ? `/u/${invite.participant.username}`
    : null;
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.025] sm:px-5">
      <Avatar className="h-10 w-10 shrink-0 rounded-full">
        {invite.participant.avatarUrl ? (
          <AvatarImage
            src={invite.participant.avatarUrl}
            alt={`${invite.participant.displayName ?? invite.participant.username ?? "Player"} avatar`}
          />
        ) : null}
        <AvatarFallback className="bg-zinc-900 text-sm text-zinc-100">
          {getAvatarFallback(invite.participant.displayName, invite.participant.username)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          {participantHref ? (
            <Link
              href={participantHref}
              className="text-[15px] font-semibold text-zinc-100 hover:underline"
            >
              {invite.participant.displayName ?? invite.participant.username ?? "Unknown player"}
            </Link>
          ) : (
            <span className="text-[15px] font-semibold text-zinc-100">
              {invite.participant.displayName ?? invite.participant.username ?? "Unknown player"}
            </span>
          )}
          {invite.participant.username ? (
            <span className="truncate text-sm text-zinc-500">
              @{invite.participant.username}
            </span>
          ) : null}
        </div>
        {(invite.message ?? invite.sourcePostTitle) ? (
          <p className="mt-0.5 truncate text-xs text-zinc-500">
            {invite.message ?? invite.sourcePostTitle}
          </p>
        ) : null}
        {feedback ? <p className="mt-0.5 text-xs text-rose-300">{feedback}</p> : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          aria-disabled={isPending}
          onClick={() => handleInviteAction("accept")}
          className="inline-flex h-7 items-center rounded-full bg-zinc-100 px-3 text-xs font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "..." : "Accept"}
        </button>
        <button
          type="button"
          disabled={isPending}
          aria-disabled={isPending}
          onClick={() => handleInviteAction("decline")}
          className="text-[11px] font-medium text-zinc-600 transition hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "..." : "Decline"}
        </button>
      </div>
    </div>
  );
}
