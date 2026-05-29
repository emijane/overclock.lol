"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import { loadOlderChatMessages, sendChatMessage } from "@/features/chat/actions";
import { ChatComposer } from "@/features/chat/components/chat-composer";
import { ChatMessageList } from "@/features/chat/components/chat-message-list";
import { ChatThreadRealtime } from "@/features/chat/components/chat-thread-realtime";
import type {
  ChatMessageRecord,
  ChatParticipantIdentity,
  ChatThreadMessagesPage,
  ChatThreadSummary,
} from "@/lib/chat/chat-types";

function mergeMessages(current: ChatMessageRecord[], incoming: ChatMessageRecord[]) {
  const byId = new Map(current.map((message) => [message.id, message]));

  for (const message of incoming) {
    byId.set(message.id, message);
  }

  return Array.from(byId.values()).sort((a, b) => {
    const createdDiff =
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

    if (createdDiff !== 0) {
      return createdDiff;
    }

    return a.id.localeCompare(b.id);
  });
}

function getLockBannerCopy(lockReason: ChatThreadSummary["lockReason"]) {
  if (lockReason === "connection_removed") {
    return "You can still read this Duo chat, but sending is disabled because the connection was removed.";
  }

  if (lockReason === "invalid_source") {
    return "This chat is temporarily locked because its Duo source is no longer valid.";
  }

  if (lockReason === "manual") {
    return "This chat is locked right now.";
  }

  return null;
}

export function ChatThreadPane({
  initialMessages,
  thread,
  viewer,
}: {
  initialMessages: ChatThreadMessagesPage;
  thread: ChatThreadSummary;
  viewer: ChatParticipantIdentity;
}) {
  const router = useRouter();
  const [composerValue, setComposerValue] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initialMessages.hasMore);
  const [isLoadingMore, startLoadingMore] = useTransition();
  const [isSending, startSending] = useTransition();
  const [lockReason, setLockReason] = useState(thread.lockReason);
  const [messages, setMessages] = useState(initialMessages.messages);

  const participants = useMemo(
    () => [viewer, thread.peer] satisfies ChatParticipantIdentity[],
    [thread.peer, viewer]
  );
  const lockBannerCopy = getLockBannerCopy(lockReason);
  const oldestMessage = messages[0] ?? null;

  function handleRealtimeMessage(message: ChatMessageRecord) {
    setMessages((current) => mergeMessages(current, [message]));
  }

  function handleLoadOlder() {
    if (!oldestMessage) {
      return;
    }

    startLoadingMore(async () => {
      const page = await loadOlderChatMessages({
        beforeCreatedAt: oldestMessage.createdAt,
        beforeId: oldestMessage.id,
        threadId: thread.id,
      });

      if (!page.isAccessible) {
        router.push("/social");
        return;
      }

      setHasMore(page.hasMore);
      setMessages((current) => mergeMessages(current, page.messages));
    });
  }

  function handleSubmit() {
    if (composerValue.trim().length === 0 || isSending || lockReason) {
      return;
    }

    startSending(async () => {
      setErrorMessage(null);
      const result = await sendChatMessage({
        body: composerValue,
        threadId: thread.id,
      });

      if (result.status === "success") {
        setComposerValue("");
        setMessages((current) => mergeMessages(current, [result.message]));
        return;
      }

      if (result.status === "locked") {
        setErrorMessage(result.message);

        if (result.lockReason === "forbidden") {
          router.push("/social");
          return;
        }

        setLockReason(result.lockReason);
        return;
      }

      if (result.status === "thread_not_found") {
        router.push("/social");
        return;
      }

      if (result.status === "rate_limited" || result.status === "error") {
        setErrorMessage(result.message);
        return;
      }

      if (result.status === "unauthenticated") {
        router.push("/login");
        return;
      }

      if (result.status === "onboarding_required") {
        router.push("/onboarding");
      }
    });
  }

  return (
    <div className="flex min-h-[34rem] flex-1 flex-col">
      <ChatThreadRealtime
        onMessage={handleRealtimeMessage}
        participants={participants}
        threadId={thread.id}
      />

      <div className="border-b border-white/[0.06] px-4 py-3 sm:px-5 lg:hidden">
        <Link
          href="/social"
          className="oc-profile-meta inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400 transition hover:text-zinc-200"
        >
          <ChevronLeftIcon className="h-3.5 w-3.5 shrink-0" />
          Inbox
        </Link>
      </div>

      <div className="border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="oc-profile-display truncate text-[17px] font-semibold tracking-[-0.03em] text-zinc-100">
                {thread.peer.displayName ?? thread.peer.username ?? "Player"}
              </h2>
              {thread.peer.username ? (
                <Link
                  href={`/u/${thread.peer.username}`}
                  className="oc-profile-meta text-[11px] text-zinc-500 transition hover:text-zinc-300"
                >
                  @{thread.peer.username}
                </Link>
              ) : null}
            </div>
            <p className="oc-profile-meta mt-1 text-[11px] leading-5 text-zinc-400">
              {thread.sourcePostTitle ?? "Accepted Duo chat"}
            </p>
          </div>
        </div>
      </div>

      {lockBannerCopy ? (
        <div className="border-b border-white/[0.06] px-4 py-3 sm:px-5">
          <div className="rounded-[12px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-3">
            <p className="oc-profile-meta text-[11px] leading-5 text-zinc-300">
              {lockBannerCopy}
            </p>
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="border-b border-white/[0.06] px-4 py-3 sm:px-5">
          <p className="oc-profile-meta text-[11px] leading-5 text-zinc-300">
            {errorMessage}
          </p>
        </div>
      ) : null}

      <ChatMessageList
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        messages={messages}
        onLoadOlder={handleLoadOlder}
        viewerProfileId={viewer.profileId}
      />

      {!lockReason ? (
        <ChatComposer
          isSending={isSending}
          onBodyChange={setComposerValue}
          onSubmit={handleSubmit}
          value={composerValue}
        />
      ) : null}
    </div>
  );
}
