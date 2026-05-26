import { FaDiscord } from "react-icons/fa";
import { SiBattledotnet } from "react-icons/si";

import { getRankIconSrc } from "@/lib/competitive/rank-icons";
import { getRankPillColors } from "@/lib/competitive/rank-border-styles";
import type { ActiveProfileConnection } from "@/lib/matches/play-invites";
import { RemoveConnectionButton } from "@/features/matches/components/remove-connection-button";
import {
  formatMatchRegion,
  formatMatchRole,
  formatMatchTimestamp,
  getDisplayableMatchMetaLabel,
  type MatchMetaChip,
  MatchRowIdentity,
} from "./match-row-shared";

type MatchCardProps = {
  connection: ActiveProfileConnection;
};

export function MatchCard({ connection }: MatchCardProps) {
  const participantHref = connection.participant.username
    ? `/u/${connection.participant.username}`
    : null;
  const metadata: MatchMetaChip[] = [];

  const rankLabel = getDisplayableMatchMetaLabel(connection.participant.rankLabel);
  const rankIconSrc = getRankIconSrc(connection.participant.rankTier);
  const rankColors = getRankPillColors(connection.participant.rankTier);

  if (rankLabel) {
    metadata.push({
      iconAlt: `${rankLabel} rank icon`,
      iconSrc: rankIconSrc,
      label: rankLabel,
      style: {
        backgroundColor: rankColors.bgSolid,
        borderColor: rankColors.border,
        color: rankColors.text,
      },
      tone: "primary",
    });
  }

  const roleLabel = getDisplayableMatchMetaLabel(
    formatMatchRole(connection.participant.mainRole)
  );

  if (roleLabel) {
    metadata.push({ label: roleLabel, tone: "secondary" });
  }

  const regionLabel = getDisplayableMatchMetaLabel(
    formatMatchRegion(connection.participant.region)
  );

  if (regionLabel) {
    metadata.push({ label: regionLabel, tone: "secondary" });
  }

  const connectedLabel = formatMatchTimestamp("Connected", connection.connectedAt);
  const hasDetails = Boolean(
    connectedLabel ||
      connection.participant.discordUsername ||
      connection.participant.battlenetHandle
  );

  return (
    <MatchRowIdentity
      action={<RemoveConnectionButton connectionId={connection.id} />}
      footer={
        hasDetails ? (
          <div className="space-y-2">
            {connectedLabel ? (
              <p className="oc-profile-meta text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                {connectedLabel}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              {connection.participant.discordUsername ? (
                <span className="oc-profile-meta inline-flex items-center gap-1.5 rounded-[9px] border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-zinc-300">
                  <FaDiscord className="oc-social-discord h-3 w-3 shrink-0" />
                  {connection.participant.discordUsername}
                </span>
              ) : null}
              {connection.participant.battlenetHandle ? (
                <span className="oc-profile-meta inline-flex items-center gap-1.5 rounded-[9px] border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-zinc-300">
                  <SiBattledotnet className="oc-social-battlenet h-3 w-3 shrink-0" />
                  {connection.participant.battlenetHandle}
                </span>
              ) : null}
            </div>
          </div>
        ) : null
      }
      href={participantHref}
      participant={connection.participant}
      primaryMeta={metadata}
    />
  );
}
