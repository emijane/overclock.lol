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
    <>
      <div className="flex shrink-0 items-center justify-between px-5 py-3 sm:px-6">
        <h1 className="oc-profile-display text-[18px] font-bold tracking-[-0.03em] text-zinc-50">
          Social
        </h1>
      </div>

      <div className="border-t border-white/[0.05]" />

      {threads.length === 0 ? (
        <div className="grid min-h-[26rem] place-items-center px-5 py-10 text-center sm:px-6">
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
        <div className="grid min-h-[34rem] lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div className={`${activeThread ? "hidden lg:block" : "block"} border-r border-white/[0.06]`}>
            <ChatThreadList activeThreadId={activeThread?.id ?? null} threads={threads} />
          </div>

          <div className="min-h-0">
            {activeThread && initialMessages ? (
              <ChatThreadPane
                initialMessages={initialMessages}
                thread={activeThread}
                viewer={viewer}
              />
            ) : (
              <div className="hidden h-full items-center justify-center px-8 lg:flex">
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
    </>
  );
}
