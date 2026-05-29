"use client";

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

function getAvatarFallback(
  displayName: string | null,
  username: string | null
) {
  return (displayName ?? username ?? "P").slice(0, 1).toUpperCase();
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
      <ul className="oc-sidebar-scroll min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5 sm:px-2">
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
                className={`block rounded-[10px] px-2.5 py-2 transition sm:px-3 ${
                  isActive
                    ? "bg-white/[0.055]"
                    : "bg-transparent hover:bg-white/[0.028]"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <Avatar className="mt-0.5 h-8.5 w-8.5 border border-white/[0.04] bg-black/25">
                    {thread.peer.avatarUrl ? (
                      <AvatarImage
                        src={thread.peer.avatarUrl}
                        alt={`${thread.peer.displayName ?? thread.peer.username ?? "Player"} avatar`}
                      />
                    ) : null}
                    <AvatarFallback className="bg-zinc-900 text-[11px] text-zinc-100">
                      {getAvatarFallback(
                        thread.peer.displayName,
                        thread.peer.username
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex min-w-0 flex-1 items-start justify-between gap-2.5">
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
                      <p className="oc-profile-meta mt-0.5 truncate text-[11px] leading-4.5 text-zinc-400">
                        {secondaryLine}
                      </p>
                    </div>
                    {thread.lastMessageAt ? (
                      <span className="oc-profile-meta mt-0.5 shrink-0 rounded-[8px] border border-white/[0.04] bg-black/12 px-1.5 py-0.5 text-[10px] text-zinc-600">
                        {new Date(thread.lastMessageAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
