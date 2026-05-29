"use client";

import { useEffect } from "react";

import type { ChatMessageRecord, ChatParticipantIdentity } from "@/lib/chat/chat-types";
import { createClient } from "@/lib/supabase/client";

function toRealtimeMessage(
  value: Record<string, unknown>,
  participantsById: Map<string, ChatParticipantIdentity>
): ChatMessageRecord | null {
  if (
    typeof value.id !== "string" ||
    typeof value.thread_id !== "string" ||
    typeof value.sender_profile_id !== "string" ||
    typeof value.body !== "string" ||
    typeof value.created_at !== "string" ||
    typeof value.updated_at !== "string"
  ) {
    return null;
  }

  const sender = participantsById.get(value.sender_profile_id);

  if (!sender) {
    return null;
  }

  return {
    body: value.body,
    createdAt: value.created_at,
    id: value.id,
    sender,
    threadId: value.thread_id,
    updatedAt: value.updated_at,
  };
}

export function ChatThreadRealtime({
  onChannelState,
  onMessage,
  participants,
  threadId,
}: {
  onChannelState?: (state: "closed" | "errored" | "timed_out") => void;
  onMessage: (message: ChatMessageRecord) => void;
  participants: ChatParticipantIdentity[];
  threadId: string;
}) {
  useEffect(() => {
    if (!threadId) {
      return;
    }

    const participantsById = new Map(
      participants.map((participant) => [participant.profileId, participant])
    );
    const supabase = createClient();
    const channelInstanceId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const channel = supabase.channel(`chat-thread:${threadId}:${channelInstanceId}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          filter: `thread_id=eq.${threadId}`,
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const message = toRealtimeMessage(
            payload.new as Record<string, unknown>,
            participantsById
          );

          if (message) {
            onMessage(message);
          }
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          onChannelState?.("errored");
        } else if (status === "TIMED_OUT") {
          onChannelState?.("timed_out");
        } else if (status === "CLOSED") {
          onChannelState?.("closed");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [onChannelState, onMessage, participants, threadId]);

  return null;
}
