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
    <div className="flex h-full min-h-0 flex-col">
      <ul className="oc-sidebar-scroll min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-2.5">
        {threads.map((thread) => {
          const lockCopy = getLockCopy(thread.lockReason);
          const isActive = thread.id === activeThreadId;
          const secondaryLine =
            thread.lastMessagePreview ??
            thread.sourcePostTitle ??
            "Your Duo chat will show up here.";

          return (
            <li key={thread.id} className="py-0.5">
              <Link
                href={`/social/duos/${thread.id}`}
                aria-current={isActive ? "page" : undefined}
                className={`block rounded-[12px] border px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition sm:px-4 ${
                  isActive
                    ? "border-white/[0.10] bg-white/[0.07]"
                    : "border-transparent bg-transparent hover:border-white/[0.06] hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="oc-profile-display truncate text-[13px] font-semibold tracking-[-0.02em] text-zinc-100">
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
                    <span className="oc-profile-meta shrink-0 rounded-[8px] border border-white/[0.04] bg-black/15 px-1.5 py-0.5 text-[10px] text-zinc-600">
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
