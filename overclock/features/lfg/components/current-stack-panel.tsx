import Link from "next/link";

import { getLFGGameModeLabel, type LFGPost } from "@/lib/lfg/lfg-post-types";

import { getCreateLFGPostErrorMessage } from "../action-rules";

type CurrentStackPanelProps = {
  currentProfileId: string;
  post: LFGPost;
  showBlockedCreateCopy?: boolean;
};

type CurrentStackFallbackPanelProps = {
  blockingPostId?: string | null;
};

const BLOCKED_CREATE_MESSAGE = getCreateLFGPostErrorMessage("already_in_active_stack");

export function isBlockedByCurrentStackMessage(message?: string) {
  return message === BLOCKED_CREATE_MESSAGE;
}

export function CurrentStackFallbackPanel({
  blockingPostId,
}: CurrentStackFallbackPanelProps) {
  return (
    <section className="px-5 pb-3 pt-1 sm:px-6 sm:pb-4 sm:pt-2">
      <div className="overflow-hidden rounded-[12px] border border-amber-500/20 bg-amber-500/[0.05]">
        <div className="px-4 py-4 sm:px-5 sm:py-4.5">
          <div className="space-y-2">
            <p className="oc-profile-meta text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200/70">
              Your current stack
            </p>
            <h2 className="oc-profile-display text-[17px] font-semibold tracking-[-0.03em] text-zinc-50">
              Stack details unavailable
            </h2>
            <p className="oc-profile-meta max-w-2xl text-[11px] leading-5 text-zinc-300">
              You are marked as active in a stack, but we could not load the stack details.
            </p>
            {blockingPostId ? (
              <p className="oc-profile-meta text-[10px] text-zinc-500">
                Blocking post id: {blockingPostId}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export function CurrentStackPanel({
  post,
}: CurrentStackPanelProps) {
  const viewHref = `/stacks/${post.id}`;

  return (
    <section className="px-5 pb-3 pt-1 sm:px-6 sm:pb-4 sm:pt-2">
      <div className="overflow-hidden rounded-[12px] border border-white/[0.06] bg-white/[0.02]">
        <div className="px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="oc-profile-meta text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Your current stack
              </p>
              <h2 className="oc-profile-display line-clamp-1 text-[15px] font-semibold tracking-[-0.03em] text-zinc-50">
                {post.title}
              </h2>
              <div className="oc-profile-meta flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px]">
                <span>{getLFGGameModeLabel(post.gameMode)}</span>
                {post.region ? (
                  <>
                    <span aria-hidden="true" className="text-zinc-700">&bull;</span>
                    <span>{post.region}</span>
                  </>
                ) : null}
                <span aria-hidden="true" className="text-zinc-700">&bull;</span>
                <span>{post.status === "filled" ? "Filled" : "Active"}</span>
              </div>
            </div>
            <Link
              href={viewHref}
              className="oc-profile-display inline-flex h-8 shrink-0 items-center rounded-[10px] border border-white/6 bg-white/3 px-3.5 text-[12px] font-semibold text-zinc-200 transition hover:border-white/12 hover:bg-white/6 hover:text-zinc-50"
            >
              View stack
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
