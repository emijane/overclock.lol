import {
  CHAT_THREAD_LOCK_REASONS,
  MAX_CHAT_MESSAGE_LENGTH,
} from "@/lib/chat/chat-constants";
import type {
  ChatMessageRecord,
  ChatParticipantIdentity,
  ChatThreadLockReason,
  ChatThreadMessagesPage,
  ChatThreadSummary,
} from "@/lib/chat/chat-types";
import { createClient } from "@/lib/supabase/server";

function isMissingRpcError(
  error: unknown,
  expectedFunctionName: string
): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as Record<string, unknown>;

  return (
    candidate.code === "PGRST202" &&
    typeof candidate.message === "string" &&
    candidate.message.includes(expectedFunctionName)
  );
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseLockReason(value: unknown): ChatThreadLockReason | null {
  return typeof value === "string" &&
    CHAT_THREAD_LOCK_REASONS.includes(value as ChatThreadLockReason)
    ? (value as ChatThreadLockReason)
    : null;
}

function parseIdentity(input: {
  avatarUrl: unknown;
  displayName: unknown;
  profileId: unknown;
  username: unknown;
}): ChatParticipantIdentity | null {
  if (typeof input.profileId !== "string") {
    return null;
  }

  return {
    avatarUrl: typeof input.avatarUrl === "string" ? input.avatarUrl : null,
    battlenetHandle: null,
    displayName:
      typeof input.displayName === "string" ? input.displayName : null,
    discordUsername: null,
    profileId: input.profileId,
    username: typeof input.username === "string" ? input.username : null,
  };
}

function normalizeThread(value: unknown): ChatThreadSummary | null {
  const record = asRecord(value);

  if (!record || typeof record.id !== "string") {
    return null;
  }

  const peer = parseIdentity({
    avatarUrl: record.peerAvatarUrl,
    displayName: record.peerDisplayName,
    profileId: record.peerProfileId,
    username: record.peerUsername,
  });

  if (!peer) {
    return null;
  }

  return {
    id: record.id,
    lastMessageAt:
      typeof record.lastMessageAt === "string" ? record.lastMessageAt : null,
    lastMessagePreview:
      typeof record.lastMessagePreview === "string"
        ? record.lastMessagePreview
        : null,
    lockReason: parseLockReason(record.lockReason),
    lockedAt: typeof record.lockedAt === "string" ? record.lockedAt : null,
    peer,
    sourceInviteId:
      typeof record.sourceInviteId === "string" ? record.sourceInviteId : null,
    sourceLfgPostId:
      typeof record.sourceLfgPostId === "string" ? record.sourceLfgPostId : null,
    sourcePostTitle:
      typeof record.sourcePostTitle === "string" ? record.sourcePostTitle : null,
    threadType: record.threadType === "stack" ? "stack" : "duo",
  };
}

function normalizeMessage(value: unknown): ChatMessageRecord | null {
  const record = asRecord(value);

  if (
    !record ||
    typeof record.id !== "string" ||
    typeof record.threadId !== "string" ||
    typeof record.body !== "string" ||
    typeof record.createdAt !== "string" ||
    typeof record.updatedAt !== "string"
  ) {
    return null;
  }

  const sender = parseIdentity({
    avatarUrl: record.senderAvatarUrl,
    displayName: record.senderDisplayName,
    profileId: record.senderProfileId,
    username: record.senderUsername,
  });

  if (!sender) {
    return null;
  }

  return {
    body: record.body,
    createdAt: record.createdAt,
    id: record.id,
    sender,
    threadId: record.threadId,
    updatedAt: record.updatedAt,
  };
}

export async function getSocialThreadsRecord() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_social_threads_dto");

  if (error) {
    throw error;
  }

  const record = asRecord(data);
  const threadsValue = record?.threads;
  const threads = Array.isArray(threadsValue)
    ? threadsValue.map(normalizeThread).filter((value): value is ChatThreadSummary => Boolean(value))
    : [];

  return { threads };
}

export async function getSocialThreadHrefMapByPeerProfileId(peerProfileIds?: string[]) {
  const { threads } = await getSocialThreadsRecord();
  const allowedPeerIds = peerProfileIds ? new Set(peerProfileIds) : null;
  const hrefsByPeerProfileId: Record<string, string> = {};

  for (const thread of threads) {
    if (thread.threadType !== "duo") {
      continue;
    }

    if (allowedPeerIds && !allowedPeerIds.has(thread.peer.profileId)) {
      continue;
    }

    if (!hrefsByPeerProfileId[thread.peer.profileId]) {
      hrefsByPeerProfileId[thread.peer.profileId] = `/social/duos/${thread.id}`;
    }
  }

  return hrefsByPeerProfileId;
}

export async function getSocialThreadHrefForInviteId(inviteId: string) {
  const { threads } = await getSocialThreadsRecord();
  const matchingThread = threads.find((thread) => thread.sourceInviteId === inviteId);

  return matchingThread ? `/social/duos/${matchingThread.id}` : null;
}

export async function getSocialThreadRecord(threadId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_social_thread_dto", {
    p_thread_id: threadId,
  });

  if (error) {
    if (isMissingRpcError(error, "public.get_social_thread_dto")) {
      console.error("Duo chat thread RPC is missing from the database schema cache.", {
        expectedFunction: "public.get_social_thread_dto(uuid)",
        hint: "Apply the forward-only duo chat RPC repair migration and ensure PostgREST reloads schema metadata.",
        likelyCause:
          "A local or shared database applied an earlier duo chat migration before the dedicated thread RPC was added.",
        threadId,
      });
      return null;
    }

    throw error;
  }

  return normalizeThread(data);
}

export async function getChatThreadMessagesRecord(input: {
  beforeCreatedAt?: string | null;
  beforeId?: string | null;
  limit?: number;
  threadId: string;
}): Promise<ChatThreadMessagesPage> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_chat_thread_messages", {
    p_before_created_at: input.beforeCreatedAt ?? null,
    p_before_id: input.beforeId ?? null,
    p_limit: input.limit ?? null,
    p_thread_id: input.threadId,
  });

  if (error) {
    throw error;
  }

  const record = asRecord(data);
  const messagesValue = record?.messages;
  const messages = Array.isArray(messagesValue)
    ? messagesValue.map(normalizeMessage).filter((value): value is ChatMessageRecord => Boolean(value))
    : [];

  return {
    hasMore: record?.hasMore === true,
    isAccessible: record?.isAccessible === true,
    messages,
  };
}

export async function sendChatMessageRecord(input: {
  body: string;
  threadId: string;
}) {
  const normalizedBody = input.body.trim();

  if (normalizedBody.length < 1 || normalizedBody.length > MAX_CHAT_MESSAGE_LENGTH) {
    return {
      created: false,
      errorCode: "invalid_message",
      message: null,
    } as const;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("send_chat_message", {
    p_body: normalizedBody,
    p_thread_id: input.threadId,
  });

  if (error) {
    throw error;
  }

  const record = asRecord(data);

  return {
    created: record?.created === true,
    errorCode: typeof record?.error_code === "string" ? record.error_code : null,
    message: normalizeMessage(record?.message ?? null),
  } as const;
}
