import Link from "next/link";

import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import { getLFGGameModeLabel, type LFGPost } from "@/lib/lfg/lfg-post-types";

import { getCreateLFGPostErrorMessage } from "../action-rules";
import { RequestToJoinButton } from "./request-to-join-button";
import { StackMemberAvatarStrip } from "./stack-member-avatar-strip";

type CurrentStackPanelProps = {
  currentProfileId: string;
  post: LFGPost;
  showBlockedCreateCopy?: boolean;
};

type CurrentStackFallbackPanelProps = {
  blockingPostId?: string | null;
};

const BLOCKED_CREATE_MESSAGE = getCreateLFGPostErrorMessage("already_in_active_stack");

function findOwner(post: LFGPost) {
  return post.stackMembers.find((member) => member.isOwner) ?? null;
}

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
  currentProfileId,
  post,
  showBlockedCreateCopy = false,
}: CurrentStackPanelProps) {
  const owner = findOwner(post);
  const isOwner = post.profileId === currentProfileId;
  const isMember = post.stackMembers.some((member) => member.profileId === currentProfileId);
  const openSpots = Math.max((post.maxGroupSize ?? post.currentMemberCount) - post.currentMemberCount, 0);
  const ownerLabel = owner?.displayName ?? owner?.username ?? "Player";
  const ownerHref = owner?.username ? `/u/${owner.username}` : null;
  const viewHref = `/stacks#stack-post-${post.id}`;
  const description = showBlockedCreateCopy
    ? "You already belong to an active stack, so creating another stack post is blocked until you leave this one or close it if you own it."
    : "You already have an active stack on the board. Jump to the feed card to manage it or keep tabs on who is in your group.";

  return (
    <section className="px-5 pb-3 pt-1 sm:px-6 sm:pb-4 sm:pt-2">
      <div className="overflow-hidden rounded-[12px] border border-white/[0.06] bg-white/[0.02]">
        <div className="px-4 py-4 sm:px-5 sm:py-4.5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="oc-profile-meta text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Your current stack
                  </span>
                  <span className="oc-profile-pill border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-300">
                    {post.currentMemberCount}/{post.maxGroupSize ?? post.currentMemberCount}
                  </span>
                  {openSpots > 0 ? (
                    <span className="oc-profile-pill border border-emerald-400/14 bg-emerald-400/[0.06] px-2 py-0.5 text-[10px] text-emerald-100/80">
                      {openSpots} open spot{openSpots === 1 ? "" : "s"}
                    </span>
                  ) : (
                    <span className="oc-profile-pill border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-400">
                      Full stack
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="oc-profile-display line-clamp-2 text-[18px] font-semibold tracking-[-0.03em] text-zinc-50">
                    {post.title}
                  </h2>
                  <div className="oc-profile-meta mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px]">
                    <span>{getLFGGameModeLabel(post.gameMode)}</span>
                    {post.region ? (
                      <>
                        <span aria-hidden="true" className="text-zinc-700">
                          &bull;
                        </span>
                        <span>{post.region}</span>
                      </>
                    ) : null}
                    <span aria-hidden="true" className="text-zinc-700">
                      &bull;
                    </span>
                    <span>{post.status === "filled" ? "Filled" : "Active"}</span>
                  </div>
                </div>
                <p className="oc-profile-meta max-w-2xl text-[11px] leading-5 text-zinc-400">
                  {description}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link
                  href={viewHref}
                  className="oc-profile-display inline-flex h-9 items-center rounded-full border border-white/[0.06] bg-white/[0.03] px-3.5 text-[13px] font-semibold text-zinc-200 transition hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-zinc-50"
                >
                  View stack
                </Link>
                {!isOwner && isMember ? (
                  <RequestToJoinButton
                    initialState="accepted"
                    lookingForRoles={post.lookingForRoles}
                    postId={post.id}
                    tone="duos"
                    viewerState="authenticated"
                  />
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
              <div className="rounded-[10px] border border-white/[0.05] bg-black/12 px-3.5 py-3">
                <p className="oc-profile-meta text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Owner
                </p>
                <div className="mt-2 min-w-0">
                  {ownerHref ? (
                    <Link
                      href={ownerHref}
                      className="oc-profile-display truncate text-[14px] font-semibold text-zinc-100 transition hover:text-white"
                    >
                      {ownerLabel}
                    </Link>
                  ) : (
                    <p className="oc-profile-display truncate text-[14px] font-semibold text-zinc-100">
                      {ownerLabel}
                    </p>
                  )}
                </div>
                <div className="mt-3">
                  <StackMemberAvatarStrip
                    currentMemberCount={post.currentMemberCount}
                    currentProfileId={currentProfileId}
                    maxGroupSize={post.maxGroupSize}
                    members={post.stackMembers}
                    postId={post.id}
                    tone="duos"
                  />
                </div>
              </div>

              <div className="rounded-[10px] border border-white/[0.05] bg-black/12 px-3.5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="oc-profile-meta text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Current members
                  </p>
                  <p className="oc-profile-meta text-[10px] text-zinc-500">
                    {openSpots > 0
                      ? `${openSpots} open spot${openSpots === 1 ? "" : "s"}`
                      : "No open spots"}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {post.stackMembers.map((member) => {
                    const memberLabel = member.displayName ?? member.username ?? "Player";
                    const memberHref = member.username ? `/u/${member.username}` : null;
                    const roleLabel = COMPETITIVE_ROLE_LABELS[member.role];

                    return memberHref ? (
                      <Link
                        key={member.profileId}
                        href={memberHref}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] text-zinc-300 transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-zinc-100"
                      >
                        <span className="oc-profile-display font-semibold text-zinc-100">
                          {memberLabel}
                        </span>
                        <span className="oc-profile-meta text-[10px] text-zinc-500">
                          {roleLabel}
                          {member.isOwner ? " / owner" : ""}
                        </span>
                      </Link>
                    ) : (
                      <div
                        key={member.profileId}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] text-zinc-300"
                      >
                        <span className="oc-profile-display font-semibold text-zinc-100">
                          {memberLabel}
                        </span>
                        <span className="oc-profile-meta text-[10px] text-zinc-500">
                          {roleLabel}
                          {member.isOwner ? " / owner" : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
