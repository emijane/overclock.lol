"use client";

import Link from "next/link";

import type { ChatThreadSummary } from "@/lib/chat/chat-types";

function getLockCopy(lockReason: ChatThreadSummary["lockReason"]) {
  if (lockReason === "connection_removed") {
    return "Read only";
  }

  if (lockReason === "invalid_source") {
    return "Locked";
  }

  if (lockReason === "manual") {
    return "Locked";
  }

  return null;
}

export function ChatThreadList({
  activeThreadId,
  threads,
}: {
  activeThreadId?: string | null;
  threads: ChatThreadSummary[];
}) {
  return (
    <div className="flex min-h-0 flex-col">
      <div className="border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
        <p className="oc-profile-meta text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
          Inbox
        </p>
        <h2 className="oc-profile-display mt-1 text-[15px] font-semibold tracking-[-0.03em] text-zinc-100">
          Duo chats
        </h2>
      </div>

      <ul className="min-h-0 divide-y divide-white/[0.06]">
        {threads.map((thread) => {
          const lockCopy = getLockCopy(thread.lockReason);
          const isActive = thread.id === activeThreadId;
          const secondaryLine =
            thread.lastMessagePreview ??
            thread.sourcePostTitle ??
            "Your Duo chat will show up here.";

          return (
            <li key={thread.id}>
              <Link
                href={`/social/duos/${thread.id}`}
                aria-current={isActive ? "page" : undefined}
                className={`block px-4 py-3 transition sm:px-5 ${
                  isActive
                    ? "bg-white/[0.05]"
                    : "hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="oc-profile-display truncate text-[13px] font-semibold text-zinc-100">
                        {thread.peer.displayName ?? thread.peer.username ?? "Player"}
                      </p>
                      {lockCopy ? (
                        <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-400">
                          {lockCopy}
                        </span>
                      ) : null}
                    </div>
                    <p className="oc-profile-meta mt-1 truncate text-[11px] leading-5 text-zinc-400">
                      {secondaryLine}
                    </p>
                  </div>
                  {thread.lastMessageAt ? (
                    <span className="oc-profile-meta shrink-0 pt-0.5 text-[10px] text-zinc-500">
                      {new Date(thread.lastMessageAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
