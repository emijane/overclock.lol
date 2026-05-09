"use client";

import { PlayInviteRealtimeRefresh } from "@/components/matches/play-invite-realtime-refresh";

type MatchesRealtimeRefreshProps = {
  currentProfileId: string;
};

export function MatchesRealtimeRefresh({
  currentProfileId,
}: MatchesRealtimeRefreshProps) {
  return <PlayInviteRealtimeRefresh currentProfileId={currentProfileId} />;
}
