import type { CHAT_THREAD_LOCK_REASONS } from "@/lib/chat/chat-constants";

export type ChatThreadType = "duo" | "stack";

export type ChatThreadLockReason = (typeof CHAT_THREAD_LOCK_REASONS)[number];

export type ChatParticipantIdentity = {
  avatarUrl: string | null;
  battlenetHandle?: string | null;
  displayName: string | null;
  discordUsername?: string | null;
  profileId: string;
  username: string | null;
};

export type ChatThreadSummary = {
  id: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lockReason: ChatThreadLockReason | null;
  lockedAt: string | null;
  peer: ChatParticipantIdentity;
  sourceInviteId: string | null;
  sourceLfgPostId: string | null;
  sourcePostTitle: string | null;
  threadType: ChatThreadType;
};

export type ChatMessageRecord = {
  body: string;
  createdAt: string;
  id: string;
  sender: ChatParticipantIdentity;
  threadId: string;
  updatedAt: string;
};

export type ChatThreadMessagesPage = {
  hasMore: boolean;
  isAccessible: boolean;
  messages: ChatMessageRecord[];
};

export type SocialPageDto = {
  threads: ChatThreadSummary[];
  viewer: ChatParticipantIdentity;
};

export type ChatThreadPageDto = SocialPageDto & {
  activeThread: ChatThreadSummary;
  initialMessages: ChatThreadMessagesPage;
};

export type SendChatMessageActionResult =
  | { status: "success"; message: ChatMessageRecord }
  | { status: "unauthenticated" }
  | { status: "onboarding_required" }
  | { status: "thread_not_found" }
  | { status: "forbidden" }
  | { status: "rate_limited"; message: string }
  | { status: "locked"; lockReason: ChatThreadLockReason | "forbidden"; message: string }
  | { status: "error"; message: string };
