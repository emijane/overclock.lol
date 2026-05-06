"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { acceptPlayInvite, declinePlayInvite } from "@/app/matches/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import type { IncomingPendingPlayInvite } from "@/lib/matches/play-invites";

type IncomingPendingInviteCardProps = {
  invite: IncomingPendingPlayInvite;
  createdAtLabel: string;
  expiresAtLabel: string;
};

function getAvatarFallback(name: string | null, username: string | null) {
  const fallbackSource = name ?? username ?? "P";
  return fallbackSource.slice(0, 1).toUpperCase();
}

function getRoleLabel(role: string | null) {
  if (role === "tank" || role === "dps" || role === "support") {
    return COMPETITIVE_ROLE_LABELS[role];
  }

  return null;
}

export function IncomingPendingInviteCard({
  invite,
  createdAtLabel,
  expiresAtLabel,
}: IncomingPendingInviteCardProps) {
  const router = useRouter();
  const participantHref = invite.participant.username
    ? `/u/${invite.participant.username}`
    : null;
  const roleLabel = getRoleLabel(invite.participant.mainRole);
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
    <article className="rounded-[20px] border border-white/10 bg-white/[0.02] p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar className="h-12 w-12 border border-white/10">
            {invite.participant.avatarUrl ? (
              <AvatarImage
                src={invite.participant.avatarUrl}
                alt={`${invite.participant.displayName ?? invite.participant.username ?? "Player"} avatar`}
              />
            ) : null}
            <AvatarFallback className="bg-zinc-900 text-zinc-100">
              {getAvatarFallback(
                invite.participant.displayName,
                invite.participant.username
              )}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold tracking-[-0.02em] text-zinc-50">
                {invite.participant.displayName ?? "Unknown player"}
              </h3>
              {participantHref ? (
                <Link
                  href={participantHref}
                  className="text-sm text-zinc-400 transition hover:text-zinc-100"
                >
                  @{invite.participant.username}
                </Link>
              ) : null}
            </div>
            <div className="mt-1 flex flex-wrap gap-2 text-xs font-medium text-zinc-400">
              {roleLabel ? <span>{roleLabel}</span> : null}
              <span>{invite.participant.rankLabel}</span>
              {invite.participant.region ? <span>{invite.participant.region}</span> : null}
            </div>
            {invite.sourcePostTitle ? (
              <p className="mt-2 text-sm text-zinc-400">
                From post: <span className="text-zinc-200">{invite.sourcePostTitle}</span>
              </p>
            ) : null}
            {invite.message ? (
              <p className="mt-2 text-sm leading-6 text-zinc-400">{invite.message}</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
          Incoming
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 border-t border-white/8 pt-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Received
            </p>
            <p className="mt-1 text-sm text-zinc-300">{createdAtLabel}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Expires
            </p>
            <p className="mt-1 text-sm text-zinc-300">{expiresAtLabel}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isPending}
            aria-disabled={isPending}
            onClick={() => handleInviteAction("accept")}
            className="inline-flex h-8 items-center rounded-full bg-zinc-100 px-3 text-xs font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Updating..." : "Accept"}
          </button>
          <button
            type="button"
            disabled={isPending}
            aria-disabled={isPending}
            onClick={() => handleInviteAction("decline")}
            className="inline-flex h-8 items-center rounded-full border border-white/10 bg-white/[0.025] px-3 text-xs font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.045] hover:text-zinc-50 disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/[0.02] disabled:text-zinc-500"
          >
            {isPending ? "Updating..." : "Decline"}
          </button>
        </div>

        {feedback ? <p className="text-xs text-rose-300">{feedback}</p> : null}
      </div>
    </article>
  );
}
