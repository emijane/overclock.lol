import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PendingSentPlayInvite } from "@/lib/matches/play-invites";
import { PendingSentInviteCancelButton } from "./pending-sent-invite-cancel-button";

type PendingSentInviteCardProps = {
  invite: PendingSentPlayInvite;
};

function getAvatarFallback(name: string | null, username: string | null) {
  const fallbackSource = name ?? username ?? "P";
  return fallbackSource.slice(0, 1).toUpperCase();
}

export function PendingSentInviteCard({ invite }: PendingSentInviteCardProps) {
  const participantHref = invite.participant.username
    ? `/u/${invite.participant.username}`
    : null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/2.5 sm:px-5">
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
      </div>

      <PendingSentInviteCancelButton inviteId={invite.id} />
    </div>
  );
}
