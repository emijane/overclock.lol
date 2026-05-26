import { getRankIconSrc } from "@/lib/competitive/rank-icons";
import type { PendingSentPlayInvite } from "@/lib/matches/play-invites";
import {
  formatMatchRegion,
  formatMatchRole,
  formatMatchTimestamp,
  getDisplayableMatchMetaLabel,
  type MatchMetaChip,
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
  const metadata: MatchMetaChip[] = [];

  const rankLabel = getDisplayableMatchMetaLabel(invite.participant.rankLabel);
  const rankIconSrc = getRankIconSrc(invite.participant.rankTier);

  if (rankLabel) {
    metadata.push({
      iconAlt: `${rankLabel} rank icon`,
      iconSrc: rankIconSrc,
      label: rankLabel,
      tone: "secondary",
    });
  }

  const roleLabel = getDisplayableMatchMetaLabel(
    formatMatchRole(invite.participant.mainRole)
  );

  if (roleLabel) {
    metadata.push({ label: roleLabel, tone: "secondary" });
  }

  const regionLabel = getDisplayableMatchMetaLabel(
    formatMatchRegion(invite.participant.region)
  );

  if (regionLabel) {
    metadata.push({ label: regionLabel, tone: "secondary" });
  }

  const expiresLabel = formatMatchTimestamp("Expires", invite.expiresAt);

  return (
    <MatchRowIdentity
      action={<PendingSentInviteCancelButton inviteId={invite.id} />}
      footer={
        <div className="space-y-2">
          {invite.message ?? invite.sourcePostTitle ? (
            <p className="oc-profile-meta line-clamp-2 text-[10px] leading-[1.125rem] text-zinc-400">
              {invite.message ?? invite.sourcePostTitle}
            </p>
          ) : null}
          {expiresLabel ? (
            <p className="oc-profile-meta text-[9px] uppercase tracking-[0.12em] text-zinc-500">
              {expiresLabel}
            </p>
          ) : null}
        </div>
      }
      href={participantHref}
      participant={invite.participant}
      primaryMeta={metadata}
    />
  );
}
