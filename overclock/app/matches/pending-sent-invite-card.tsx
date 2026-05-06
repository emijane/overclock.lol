import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import type { PendingSentPlayInvite } from "@/lib/matches/play-invites";
import { PendingSentInviteCancelButton } from "./pending-sent-invite-cancel-button";

type PendingSentInviteCardProps = {
  invite: PendingSentPlayInvite;
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

export function PendingSentInviteCard({
  invite,
  createdAtLabel,
  expiresAtLabel,
}: PendingSentInviteCardProps) {
  const participantHref = invite.participant.username
    ? `/u/${invite.participant.username}`
    : null;
  const roleLabel = getRoleLabel(invite.participant.mainRole);

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

        <div className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
          Invite sent
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 border-t border-white/8 pt-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Sent
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

        <PendingSentInviteCancelButton inviteId={invite.id} />
      </div>
    </article>
  );
}
