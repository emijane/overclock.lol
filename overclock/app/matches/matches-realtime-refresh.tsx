"use client";

import { PlayInviteRealtimeRefresh } from "@/app/components/play-invite-realtime-refresh";

type MatchesRealtimeRefreshProps = {
  currentProfileId: string;
};

export function MatchesRealtimeRefresh({
  currentProfileId,
}: MatchesRealtimeRefreshProps) {
  return <PlayInviteRealtimeRefresh currentProfileId={currentProfileId} />;
}
