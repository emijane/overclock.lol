import type { PendingSentPlayInvite } from "@/lib/matches/play-invites";
import {
  formatMatchRegion,
  formatMatchRole,
  formatMatchTimestamp,
  MatchRowIdentity,
} from "./match-row-shared";
import { PendingSentInviteCancelButton } from "./pending-sent-invite-cancel-button";

type PendingSentInviteCardProps = {
  invite: PendingSentPlayInvite;
};

export function PendingSentInviteCard({ invite }: PendingSentInviteCardProps) {
  const participantHref = invite.participant.username
    ? `/u/${invite.participant.username}`
    : null;
  const metadata = [
    invite.participant.rankLabel,
    formatMatchRole(invite.participant.mainRole),
    formatMatchRegion(invite.participant.region),
  ].filter((value): value is string => Boolean(value));
  const expiresLabel = formatMatchTimestamp("Expires", invite.expiresAt);

  return (
    <MatchRowIdentity
      action={<PendingSentInviteCancelButton inviteId={invite.id} />}
      footer={
        <div className="space-y-1">
          {invite.message ?? invite.sourcePostTitle ? (
            <p className="oc-profile-meta truncate text-[11px] text-zinc-400">
              {invite.message ?? invite.sourcePostTitle}
            </p>
          ) : null}
          {expiresLabel ? <p className="oc-profile-meta text-[11px]">{expiresLabel}</p> : null}
        </div>
      }
      href={participantHref}
      participant={invite.participant}
      primaryMeta={metadata}
    />
  );
}
