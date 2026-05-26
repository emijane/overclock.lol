import { FaDiscord } from "react-icons/fa";
import { SiBattledotnet } from "react-icons/si";

import type { ActiveProfileConnection } from "@/lib/matches/play-invites";
import { RemoveConnectionButton } from "@/features/matches/components/remove-connection-button";
import {
  formatMatchRegion,
  formatMatchRole,
  formatMatchTimestamp,
  MatchRowIdentity,
} from "./match-row-shared";

type MatchCardProps = {
  connection: ActiveProfileConnection;
};

export function MatchCard({ connection }: MatchCardProps) {
  const participantHref = connection.participant.username
    ? `/u/${connection.participant.username}`
    : null;
  const metadata = [
    connection.participant.rankLabel,
    formatMatchRole(connection.participant.mainRole),
    formatMatchRegion(connection.participant.region),
  ].filter((value): value is string => Boolean(value));
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
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              {connectedLabel ? <span className="oc-profile-meta">{connectedLabel}</span> : null}
              {connection.participant.discordUsername ? (
                <span className="oc-profile-meta flex items-center gap-1">
                  <FaDiscord className="oc-social-discord h-3.5 w-3.5 shrink-0" />
                  {connection.participant.discordUsername}
                </span>
              ) : null}
              {connection.participant.battlenetHandle ? (
                <span className="oc-profile-meta flex items-center gap-1">
                  <SiBattledotnet className="oc-social-battlenet h-3.5 w-3.5 shrink-0" />
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
