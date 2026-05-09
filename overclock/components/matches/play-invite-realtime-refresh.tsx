"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type PlayInviteRealtimeRefreshProps = {
  currentProfileId: string;
};

export function PlayInviteRealtimeRefresh({
  currentProfileId,
}: PlayInviteRealtimeRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!currentProfileId) {
      return;
    }

    const supabase = createClient();
    const channelInstanceId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const channel = supabase.channel(
      `play-invites:${currentProfileId}:${channelInstanceId}`
    );
    let refreshTimeoutId: number | null = null;

    function scheduleRefresh() {
      if (refreshTimeoutId !== null) {
        window.clearTimeout(refreshTimeoutId);
      }

      refreshTimeoutId = window.setTimeout(() => {
        router.refresh();
      }, 250);
    }

    channel
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "play_invites",
        filter: `recipient_profile_id=eq.${currentProfileId}`,
      }, scheduleRefresh)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "play_invites",
        filter: `sender_profile_id=eq.${currentProfileId}`,
      }, scheduleRefresh)
      .subscribe();

    return () => {
      if (refreshTimeoutId !== null) {
        window.clearTimeout(refreshTimeoutId);
      }

      void supabase.removeChannel(channel);
    };
  }, [currentProfileId, router]);

  return null;
}
