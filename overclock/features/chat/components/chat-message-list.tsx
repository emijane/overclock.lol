"use client";

import type { ChatMessageRecord } from "@/lib/chat/chat-types";

export function getFormattedMessageTimestamp(value: string, now = new Date()) {
  const date = new Date(value);

  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  ) {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ChatMessageList({
  hasMore,
  isLoadingMore,
  messages,
  onLoadOlder,
  viewerProfileId,
}: {
  hasMore: boolean;
  isLoadingMore: boolean;
  messages: ChatMessageRecord[];
  onLoadOlder: () => void;
  viewerProfileId: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-white/[0.06] px-4 py-2.5 sm:px-5">
        {hasMore ? (
          <button
            type="button"
            onClick={onLoadOlder}
            disabled={isLoadingMore}
            className="oc-profile-meta inline-flex h-8 items-center rounded-[10px] border border-white/[0.06] bg-white/[0.03] px-3 text-[11px] font-medium text-zinc-400 transition hover:border-white/[0.1] hover:bg-white/[0.05] hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoadingMore ? "Loading..." : "Load older messages"}
          </button>
        ) : (
          <p className="oc-profile-meta text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            Start of chat
          </p>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-5">
        {messages.map((message) => {
          const isOwnMessage = message.sender.profileId === viewerProfileId;

          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-[14px] px-3.5 py-2.5 sm:max-w-[75%] ${
                  isOwnMessage
                    ? "bg-white/[0.08] text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    : "border border-white/[0.05] bg-black/12 text-zinc-200"
                }`}
              >
                {!isOwnMessage ? (
                  <p className="oc-profile-meta mb-1 text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                    {message.sender.displayName ?? message.sender.username ?? "Player"}
                  </p>
                ) : null}
                <p className="text-[13px] leading-6 whitespace-pre-wrap break-words">
                  {message.body}
                </p>
                <p className="oc-profile-meta mt-1.5 text-[10px] text-zinc-500">
                  {getFormattedMessageTimestamp(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
