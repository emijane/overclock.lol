"use client";

import { ChatThreadList } from "@/features/chat/components/chat-thread-list";
import { ChatThreadPane } from "@/features/chat/components/chat-thread-pane";
import type { ChatThreadMessagesPage, ChatThreadSummary, SocialPageDto } from "@/lib/chat/chat-types";

type SocialPageViewProps = SocialPageDto & {
  activeThread?: ChatThreadSummary | null;
  initialMessages?: ChatThreadMessagesPage | null;
};

export function SocialPageView({
  activeThread = null,
  initialMessages = null,
  threads,
  viewer,
}: SocialPageViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between px-5 py-3 sm:px-6">
        <h1 className="oc-profile-display text-[18px] font-bold tracking-[-0.03em] text-zinc-50">
          Social
        </h1>
        {threads.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="oc-profile-meta inline-flex h-6 items-center rounded-[9px] border border-white/[0.07] bg-black/30 px-2.5 text-[9px] font-medium uppercase tracking-[0.08em] text-zinc-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              Inbox
            </span>
            <span className="oc-profile-meta text-[10px] text-zinc-600">
              {threads.length}
            </span>
          </div>
        ) : null}
      </div>

      {threads.length === 0 ? (
        <div className="grid min-h-0 flex-1 place-items-center px-5 py-10 text-center sm:px-6">
          <div className="max-w-sm space-y-2">
            <p className="oc-profile-meta text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
              Duo chat
            </p>
            <p className="oc-profile-display text-sm font-medium tracking-[-0.01em] text-zinc-200">
              No chats yet
            </p>
            <p className="oc-profile-meta text-[11px] leading-5">
              Accepted Duo requests create a private thread here once both players
              are connected.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div
            className={`${activeThread ? "hidden lg:block" : "block"} min-h-0 overflow-hidden border-r border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.008)_100%)]`}
          >
            <ChatThreadList activeThreadId={activeThread?.id ?? null} threads={threads} />
          </div>

          <div className="min-h-0 overflow-hidden">
            {activeThread && initialMessages ? (
              <ChatThreadPane
                initialMessages={initialMessages}
                thread={activeThread}
                viewer={viewer}
              />
            ) : (
              <div className="hidden h-full min-h-0 items-center justify-center px-8 lg:flex">
                <div className="max-w-sm text-center">
                  <p className="oc-profile-display text-[15px] font-semibold tracking-[-0.02em] text-zinc-200">
                    Choose a chat
                  </p>
                  <p className="oc-profile-meta mt-2 text-[11px] leading-5">
                    Your accepted Duo conversations show up in the inbox on the left.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
