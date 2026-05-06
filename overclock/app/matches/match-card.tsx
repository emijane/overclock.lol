import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import type { AcceptedPlayMatch } from "@/lib/matches/play-invites";

type MatchCardProps = {
  match: AcceptedPlayMatch;
  acceptedAtLabel: string;
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

export function MatchCard({ match, acceptedAtLabel }: MatchCardProps) {
  const participantHref = match.participant.username
    ? `/u/${match.participant.username}`
    : null;
  const roleLabel = getRoleLabel(match.participant.mainRole);
  const hasContacts =
    Boolean(match.participant.discordUsername) ||
    Boolean(match.participant.battlenetHandle);

  return (
    <article className="rounded-[20px] border border-white/10 bg-white/[0.02] p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar className="h-12 w-12 border border-white/10">
            {match.participant.avatarUrl ? (
              <AvatarImage
                src={match.participant.avatarUrl}
                alt={`${match.participant.displayName ?? match.participant.username ?? "Player"} avatar`}
              />
            ) : null}
            <AvatarFallback className="bg-zinc-900 text-zinc-100">
              {getAvatarFallback(
                match.participant.displayName,
                match.participant.username
              )}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold tracking-[-0.02em] text-zinc-50">
                {match.participant.displayName ?? "Unknown player"}
              </h3>
              {participantHref ? (
                <Link
                  href={participantHref}
                  className="text-sm text-zinc-400 transition hover:text-zinc-100"
                >
                  @{match.participant.username}
                </Link>
              ) : null}
            </div>
            <div className="mt-1 flex flex-wrap gap-2 text-xs font-medium text-zinc-400">
              {roleLabel ? <span>{roleLabel}</span> : null}
              <span>{match.participant.rankLabel}</span>
              {match.participant.region ? <span>{match.participant.region}</span> : null}
            </div>
            {match.sourcePostTitle ? (
              <p className="mt-2 text-sm text-zinc-400">
                From post: <span className="text-zinc-200">{match.sourcePostTitle}</span>
              </p>
            ) : null}
            {match.message ? (
              <p className="mt-2 text-sm leading-6 text-zinc-400">{match.message}</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
          Matched
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t border-white/8 pt-4 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Accepted
          </p>
          <p className="mt-1 text-sm text-zinc-300">{acceptedAtLabel}</p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Contact unlock
          </p>
          {hasContacts ? (
            <div className="mt-1 space-y-1 text-sm text-zinc-300">
              {match.participant.discordUsername ? (
                <p>Discord: @{match.participant.discordUsername}</p>
              ) : null}
              {match.participant.battlenetHandle ? (
                <p>Battle.net: {match.participant.battlenetHandle}</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-1 text-sm text-zinc-500">
              This player has not added Discord or Battle.net to their profile.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
