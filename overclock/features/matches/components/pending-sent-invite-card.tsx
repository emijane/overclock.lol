import type { PendingSentPlayInvite } from "@/lib/matches/play-invites";
import {
  formatMatchRegion,
  formatMatchRole,
  formatMatchTimestamp,
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

  if (invite.participant.rankLabel) {
    metadata.push({ label: invite.participant.rankLabel, tone: "primary" });
  }

  const roleLabel = formatMatchRole(invite.participant.mainRole);

  if (roleLabel) {
    metadata.push({ label: roleLabel, tone: "secondary" });
  }

  metadata.push({
    label: formatMatchRegion(invite.participant.region) ?? "Not set",
    tone: invite.participant.region ? "secondary" : "muted",
  });

  const expiresLabel = formatMatchTimestamp("Expires", invite.expiresAt);

  return (
    <MatchRowIdentity
      action={<PendingSentInviteCancelButton inviteId={invite.id} />}
      footer={
        <div className="space-y-2">
          {invite.message ?? invite.sourcePostTitle ? (
            <p className="oc-profile-meta line-clamp-2 text-[11px] leading-5 text-zinc-400">
              {invite.message ?? invite.sourcePostTitle}
            </p>
          ) : null}
          {expiresLabel ? (
            <p className="oc-profile-meta text-[10px] uppercase tracking-[0.12em] text-zinc-500">
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
