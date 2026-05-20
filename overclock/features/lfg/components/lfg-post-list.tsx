"use client";

import { useState } from "react";
import Link from "next/link";

import type {
  InviteViewerState,
  LFGInviteStateMap,
} from "@/lib/matches/play-invite-types";
import type { LFGPost } from "@/lib/lfg/lfg-post-types";
import { LFGPostCard } from "./lfg-post-card";
import { StackPostCard } from "./stack-post-card";

type StackRequestStateMap = Record<string, "none" | "pending" | "accepted" | "declined">;

type LFGPostListProps = {
  cardClassName?: string;
  currentProfileId?: string | null;
  emptyStateDescription: string;
  emptyStateTitle: string;
  errorMessage?: string | null;
  hasActiveFilters?: boolean;
  inviteStates?: LFGInviteStateMap;
  layout?: "list" | "grid-3";
  posts: LFGPost[];
  retryHref?: string;
  stackRequestStates?: StackRequestStateMap;
  tone?: "default" | "duos";
  viewerState?: InviteViewerState;
};

function LFGFeedPlaceholder({
  ctaHref,
  ctaLabel,
  description,
  tone = "default",
  title,
}: {
  ctaHref?: string;
  ctaLabel?: string;
  description: string;
  tone?: "default" | "duos";
  title: string;
}) {
  return (
    <div className={`grid min-h-[280px] place-items-center px-5 py-10 text-center ${
      tone === "duos"
        ? "rounded-[12px] border border-white/[0.06] bg-white/[0.02]"
        : "oc-surface-panel rounded-[20px]"
    }`}>
      <div className="max-w-sm">
        <span className={`mx-auto grid h-11 w-11 place-items-center rounded-full text-zinc-400 ${
          tone === "duos" ? "border border-white/[0.06] bg-white/[0.03]" : "bg-white/[0.05]"
        }`}>
          <span className="text-lg">?</span>
        </span>
        <h2 className="oc-profile-display mt-4 text-base font-semibold text-zinc-100">{title}</h2>
        <p className="oc-profile-meta mt-2 text-[11px] leading-5">{description}</p>
        {ctaHref && ctaLabel ? (
          <Link
            href={ctaHref}
            className="oc-profile-display mt-5 inline-flex h-9 items-center rounded-full border border-white/[0.06] bg-white/[0.03] px-4 text-[13px] font-semibold text-zinc-200 transition hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-zinc-50"
          >
            {ctaLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function LFGPostList({
  cardClassName,
  currentProfileId,
  emptyStateDescription,
  emptyStateTitle,
  errorMessage,
  hasActiveFilters = false,
  inviteStates,
  layout = "list",
  posts,
  retryHref,
  stackRequestStates,
  tone = "default",
  viewerState = "guest",
}: LFGPostListProps) {
  const [invitedProfileIds, setInvitedProfileIds] = useState<Set<string>>(new Set());

  function handleInviteSent(profileId: string) {
    setInvitedProfileIds((prev) => new Set([...prev, profileId]));
  }

  if (errorMessage) {
    return (
      <section className="px-5 pb-5 pt-2 sm:px-6 sm:pb-6 sm:pt-3">
        <LFGFeedPlaceholder
          ctaHref={retryHref}
          ctaLabel="Reload Section"
          description={`${errorMessage} Reload this section to try again.`}
          tone={tone}
          title="Unable to load this feed"
        />
      </section>
    );
  }

  if (posts.length === 0) {
    return (
      <section className="px-5 pb-5 pt-2 sm:px-6 sm:pb-6 sm:pt-3">
        <LFGFeedPlaceholder
          description={
            hasActiveFilters
              ? "No posts match the filters you have selected right now. Try widening your filters or clear all to see more listings."
              : emptyStateDescription
          }
          tone={tone}
          title={hasActiveFilters ? "No matching posts" : emptyStateTitle}
        />
      </section>
    );
  }

  return (
    <section className="px-5 pb-5 pt-2 sm:px-6 sm:pb-6 sm:pt-3">
      <div
        className={
          layout === "grid-3"
            ? tone === "duos"
              ? "grid gap-2.5 md:grid-cols-2 xl:grid-cols-3"
              : "grid gap-3 md:grid-cols-2 xl:grid-cols-4"
            : "grid gap-3"
        }
      >
        {posts.map((post) => {
          if (post.lfgType === "stacks") {
            const requestState = stackRequestStates?.[post.id] ?? "none";
            return (
              <div key={post.id} id={`stack-post-${post.id}`} className="scroll-mt-24">
                <StackPostCard
                  cardClassName={cardClassName}
                  currentProfileId={currentProfileId}
                  post={post}
                  requestState={requestState}
                  returnPath="/stacks"
                  tone={tone}
                />
              </div>
            );
          }

          const serverState = inviteStates?.[post.id] ?? "invite_to_play";
          const effectiveState =
            post.profileId && invitedProfileIds.has(post.profileId)
              ? "invite_sent"
              : serverState;

          return (
            <div key={post.id}>
              <LFGPostCard
                cardClassName={cardClassName}
                currentProfileId={currentProfileId}
                inviteState={effectiveState}
                onInviteSent={handleInviteSent}
                post={post}
                returnPath={`/${post.lfgType}`}
                tone={tone}
                viewerState={viewerState}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
