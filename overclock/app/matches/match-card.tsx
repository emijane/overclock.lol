import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RemoveConnectionButton } from "@/app/matches/remove-connection-button";
import type { ActiveProfileConnection } from "@/lib/matches/play-invites";

type MatchCardProps = {
  connection: ActiveProfileConnection;
};

function getAvatarFallback(name: string | null, username: string | null) {
  const fallbackSource = name ?? username ?? "P";
  return fallbackSource.slice(0, 1).toUpperCase();
}

export function MatchCard({ connection }: MatchCardProps) {
  const participantHref = connection.participant.username
    ? `/u/${connection.participant.username}`
    : null;
  const hasContacts =
    Boolean(connection.participant.discordUsername) ||
    Boolean(connection.participant.battlenetHandle);

  return (
    <div className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.025] sm:px-5">
      <Avatar className="h-10 w-10 shrink-0 rounded-full">
        {connection.participant.avatarUrl ? (
          <AvatarImage
            src={connection.participant.avatarUrl}
            alt={`${connection.participant.displayName ?? connection.participant.username ?? "Player"} avatar`}
          />
        ) : null}
        <AvatarFallback className="bg-zinc-900 text-sm text-zinc-100">
          {getAvatarFallback(
            connection.participant.displayName,
            connection.participant.username
          )}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          {participantHref ? (
            <Link
              href={participantHref}
              className="text-[15px] font-semibold text-zinc-100 hover:underline"
            >
              {connection.participant.displayName ?? connection.participant.username ?? "Unknown player"}
            </Link>
          ) : (
            <span className="text-[15px] font-semibold text-zinc-100">
              {connection.participant.displayName ?? connection.participant.username ?? "Unknown player"}
            </span>
          )}
          {connection.participant.username ? (
            <span className="truncate text-sm text-zinc-500">
              @{connection.participant.username}
            </span>
          ) : null}
        </div>

        {hasContacts ? (
          <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-zinc-500">
            {connection.participant.discordUsername ? (
              <span>@{connection.participant.discordUsername}</span>
            ) : null}
            {connection.participant.battlenetHandle ? (
              <span>{connection.participant.battlenetHandle}</span>
            ) : null}
          </div>
        ) : null}
      </div>

      <RemoveConnectionButton connectionId={connection.id} />
    </div>
  );
}
