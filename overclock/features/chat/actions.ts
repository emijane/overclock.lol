"use server";

import { revalidatePath } from "next/cache";

import { CHAT_PAGE_SIZE } from "@/lib/chat/chat-constants";
import {
  getChatThreadMessagesRecord,
  sendChatMessageRecord,
} from "@/lib/chat/chat-records";
import type {
  SendChatMessageActionResult,
  ChatThreadMessagesPage,
} from "@/lib/chat/chat-types";
import { getCurrentProfileIdentity } from "@/lib/profiles/get-current-profile";

function getLockedMessage(reason: string) {
  if (reason === "connection_removed") {
    return "Sending is disabled because this Duo connection is no longer active.";
  }

  if (reason === "archived") {
    return "This chat has been archived.";
  }

  if (reason === "blocked") {
    return "This chat is no longer available.";
  }

  return "Sending is disabled for this chat right now.";
}

export async function sendChatMessage(input: {
  body: string;
  threadId: string;
}): Promise<SendChatMessageActionResult> {
  const { user, profile } = await getCurrentProfileIdentity();

  if (!user) {
    return { status: "unauthenticated" };
  }

  if (!profile) {
    return { status: "onboarding_required" };
  }

  try {
    const result = await sendChatMessageRecord(input);

    if (result.created && result.message) {
      revalidatePath("/social");
      revalidatePath(`/social/duos/${input.threadId}`);
      return { status: "success", message: result.message };
    }

    if (result.errorCode === "rate_limited") {
      return {
        status: "rate_limited",
        message: "You are sending messages too quickly right now.",
      };
    }

    if (result.errorCode === "thread_not_found") {
      return { status: "thread_not_found" };
    }

    if (
      result.errorCode === "connection_removed" ||
      result.errorCode === "blocked" ||
      result.errorCode === "invalid_source" ||
      result.errorCode === "archived" ||
      result.errorCode === "manual"
    ) {
      return {
        status: "locked",
        lockReason: result.errorCode,
        message: getLockedMessage(result.errorCode),
      };
    }

    if (result.errorCode === "forbidden") {
      return {
        status: "locked",
        lockReason: "forbidden",
        message: "This chat is no longer available.",
      };
    }

    return {
      status: "error",
      message: "Unable to send that message right now.",
    };
  } catch (error) {
    console.error("Chat message send failed", {
      error,
      threadId: input.threadId,
      viewerProfileId: profile.id,
    });

    return {
      status: "error",
      message: "Unable to send that message right now.",
    };
  }
}

export async function loadOlderChatMessages(input: {
  beforeCreatedAt?: string | null;
  beforeId?: string | null;
  threadId: string;
}): Promise<ChatThreadMessagesPage> {
  const { user, profile } = await getCurrentProfileIdentity();

  if (!user || !profile) {
    return {
      hasMore: false,
      isAccessible: false,
      messages: [],
    };
  }

  try {
    return await getChatThreadMessagesRecord({
      beforeCreatedAt: input.beforeCreatedAt ?? null,
      beforeId: input.beforeId ?? null,
      limit: CHAT_PAGE_SIZE,
      threadId: input.threadId,
    });
  } catch (error) {
    console.error("Older chat message load failed", {
      beforeCreatedAt: input.beforeCreatedAt ?? null,
      beforeId: input.beforeId ?? null,
      error,
      threadId: input.threadId,
      viewerProfileId: profile.id,
    });

    return {
      hasMore: false,
      isAccessible: false,
      messages: [],
    };
  }
}
