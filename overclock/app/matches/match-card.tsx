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
    <article className="rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] px-4 py-3.5 shadow-[0_16px_36px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.03)] sm:px-4.5 sm:py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Avatar className="h-11 w-11 shrink-0 border border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
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

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-[15px] font-semibold tracking-[-0.025em] text-zinc-50">
                {match.participant.displayName ?? "Unknown player"}
              </h3>
              {participantHref ? (
                <Link
                  href={participantHref}
                  className="truncate text-xs text-zinc-500 transition hover:text-zinc-200"
                >
                  @{match.participant.username}
                </Link>
              ) : null}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
              {roleLabel ? (
                <span className="rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 text-zinc-300">
                  {roleLabel}
                </span>
              ) : null}
              <span className="rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 text-zinc-300">
                {match.participant.rankLabel}
              </span>
              {match.participant.region ? (
                <span className="rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 text-zinc-400">
                  {match.participant.region}
                </span>
              ) : null}
            </div>
            {match.sourcePostTitle ? (
              <p className="mt-2 text-xs text-zinc-500">
                From post: <span className="text-zinc-200">{match.sourcePostTitle}</span>
              </p>
            ) : null}
            {match.message ? (
              <p className="mt-2 text-sm leading-5 text-zinc-400">
                {match.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
          Matched
        </div>
      </div>

      <div className="mt-3 border-t border-white/8 pt-3">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
              Accepted
            </span>
            <span className="truncate text-sm text-zinc-300">{acceptedAtLabel}</span>
          </div>

          <div className="flex min-w-0 items-start gap-2 sm:items-center">
            <span className="pt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600 sm:pt-0">
              Contact
            </span>
            {hasContacts ? (
              <div className="flex flex-wrap gap-1.5 text-[11px] text-zinc-300">
                {match.participant.discordUsername ? (
                  <span className="rounded-full border border-white/8 bg-black/20 px-2 py-1">
                    Discord: @{match.participant.discordUsername}
                  </span>
                ) : null}
                {match.participant.battlenetHandle ? (
                  <span className="rounded-full border border-white/8 bg-black/20 px-2 py-1">
                    Battle.net: {match.participant.battlenetHandle}
                  </span>
                ) : null}
              </div>
            ) : (
              <span className="text-sm text-zinc-500">
                No Discord or Battle.net added.
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
