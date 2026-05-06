import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RemoveConnectionButton } from "@/app/matches/remove-connection-button";
import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import type { ActiveProfileConnection } from "@/lib/matches/play-invites";

type MatchCardProps = {
  connectedAtLabel: string;
  connection: ActiveProfileConnection;
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

export function MatchCard({ connection, connectedAtLabel }: MatchCardProps) {
  const participantHref = connection.participant.username
    ? `/u/${connection.participant.username}`
    : null;
  const roleLabel = getRoleLabel(connection.participant.mainRole);
  const hasContacts =
    Boolean(connection.participant.discordUsername) ||
    Boolean(connection.participant.battlenetHandle);

  return (
    <article className="rounded-[20px] border border-white/10 bg-white/[0.02] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Avatar className="h-12 w-12 shrink-0 border border-white/10">
            {connection.participant.avatarUrl ? (
              <AvatarImage
                src={connection.participant.avatarUrl}
                alt={`${connection.participant.displayName ?? connection.participant.username ?? "Player"} avatar`}
              />
            ) : null}
            <AvatarFallback className="bg-zinc-900 text-zinc-100">
              {getAvatarFallback(
                connection.participant.displayName,
                connection.participant.username
              )}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-[15px] font-semibold tracking-[-0.02em] text-zinc-50">
                {connection.participant.displayName ?? "Unknown player"}
              </h3>
              {participantHref ? (
                <Link
                  href={participantHref}
                  className="truncate text-xs text-zinc-500 transition hover:text-zinc-200"
                >
                  @{connection.participant.username}
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
                {connection.participant.rankLabel}
              </span>
              {connection.participant.region ? (
                <span className="rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 text-zinc-400">
                  {connection.participant.region}
                </span>
              ) : null}
            </div>
            {connection.sourcePostTitle ? (
              <p className="mt-2 text-xs text-zinc-500">
                From post: <span className="text-zinc-200">{connection.sourcePostTitle}</span>
              </p>
            ) : null}
            {connection.message ? (
              <p className="mt-2 text-sm leading-5 text-zinc-400">
                {connection.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
            Connected
          </div>
          <RemoveConnectionButton connectionId={connection.id} />
        </div>
      </div>

      <div className="mt-3 border-t border-white/8 pt-3">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
              Connected
            </span>
            <span className="truncate text-sm text-zinc-300">{connectedAtLabel}</span>
          </div>

          <div className="flex min-w-0 items-start gap-2 sm:items-center">
            <span className="pt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600 sm:pt-0">
              Contact
            </span>
            {hasContacts ? (
              <div className="flex flex-wrap gap-1.5 text-[11px] text-zinc-300">
                {connection.participant.discordUsername ? (
                  <span className="rounded-full border border-white/8 bg-black/20 px-2 py-1">
                    Discord: @{connection.participant.discordUsername}
                  </span>
                ) : null}
                {connection.participant.battlenetHandle ? (
                  <span className="rounded-full border border-white/8 bg-black/20 px-2 py-1">
                    Battle.net: {connection.participant.battlenetHandle}
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
