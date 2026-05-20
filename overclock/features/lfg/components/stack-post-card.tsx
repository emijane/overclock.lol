import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { PresenceIndicator } from "@/components/presence/presence-indicator";
import { UserBlockMenu } from "@/components/blocks/user-block-controls";
import { getBadgeAssetSrc, getBadgePreset } from "@/lib/badges/badge-assets";
import { getRankIconSrc } from "@/lib/competitive/rank-icons";
import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import { getLFGGameModeLabel, type LFGPost } from "@/lib/lfg/lfg-post-types";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";
import { RankedAvatar } from "@/features/profile/components/ranked-avatar";
import { formatPostDate } from "./format-post-date";
import { LFGPostActionsMenu } from "@/components/lfg/lfg-post-actions-menu";
import { RequestToJoinButton } from "./request-to-join-button";
import { StackMemberAvatarStrip } from "./stack-member-avatar-strip";
import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";

type StackRequestViewerState = "none" | "pending" | "accepted" | "declined";

type StackPostCardProps = {
  cardClassName?: string;
  currentProfileId?: string | null;
  post: LFGPost;
  requestState?: StackRequestViewerState;
  returnPath?: string;
  sectionLabel?: string | null;
  showActions?: boolean;
  statusPill?: ReactNode;
  viewHref?: string;
  viewLabel?: string;
};

function getModeBadgeClassName(gameMode: LFGPost["gameMode"]) {
  if (gameMode === "quick_play") {
    return "border-white/[0.07] bg-black/44 text-zinc-300";
  }
  return "border-white/[0.07] bg-black/44 text-zinc-300";
}

function getRoleClassName(role: CompetitiveRole) {
  if (role === "tank") return "border-sky-400/14 bg-sky-400/[0.045] text-sky-100/72";
  if (role === "dps") return "border-rose-400/14 bg-rose-400/[0.045] text-rose-100/72";
  return "border-emerald-400/14 bg-emerald-400/[0.045] text-emerald-100/72";
}

function getAvailableRoleCounts(roles: CompetitiveRole[]) {
  const counts = new Map<CompetitiveRole, number>();

  for (const role of roles) {
    counts.set(role, (counts.get(role) ?? 0) + 1);
  }

  return counts;
}

export function StackPostCard({
  cardClassName,
  currentProfileId,
  post,
  requestState = "none",
  returnPath,
  sectionLabel,
  showActions = true,
  statusPill,
  viewHref,
  viewLabel,
}: StackPostCardProps) {
  const rankLabel = formatCurrentRank(post.rankTier, post.rankDivision);
  const rankIconSrc = getRankIconSrc(post.rankTier);
  const modeBadgeClassName = getModeBadgeClassName(post.gameMode);
  const createdAtLabel = formatPostDate(post.createdAt);
  const gameModeLabel = getLFGGameModeLabel(post.gameMode);
  const displayName = post.author.displayName ?? post.author.username ?? "Player";
  const visibleName = post.author.username ?? post.author.displayName ?? "Player";
  const profileHref = post.author.username ? `/u/${post.author.username}` : null;
  const isOwner = Boolean(currentProfileId && post.profileId === currentProfileId);
  const isMember = Boolean(
    currentProfileId && post.stackMembers.some((member) => member.profileId === currentProfileId)
  );
  const isFull =
    post.currentMemberCount >= (post.maxGroupSize ?? 5) || post.status === "filled";

  const viewerState = isOwner ? "owner" : currentProfileId ? "authenticated" : "guest";

  const availableRoleCounts = getAvailableRoleCounts(post.lookingForRoles);

  return (
    <article
      aria-label={post.title}
      className={`oc-surface-solid-lift group h-full rounded-[12px]${
        cardClassName ? ` ${cardClassName}` : ""
      }`}
    >
      <div className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-[11px] bg-[var(--oc-bg-card)]">
        <div className="relative h-14 overflow-hidden bg-zinc-950/95">
          {post.author.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.author.coverImageUrl}
              alt=""
              className="h-full w-full object-cover brightness-[0.28] saturate-[0.56] opacity-80"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-black/32 via-black/50 to-[var(--oc-bg-card)]" />
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-[var(--oc-bg-card)]" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col px-3 pb-3 pt-2">
          <div className="absolute right-3 top-2 z-20 flex items-center gap-1">
            {post.platform ? (
              <span className="oc-overlay-chip inline-flex h-4.5 items-center rounded-[5px] px-1.5 text-[9px] font-medium text-zinc-300 backdrop-blur-[2px]">
                {post.platform}
              </span>
            ) : null}
            <span className={`shrink-0 rounded-[5px] border px-1.5 py-0.5 text-[9px] font-medium ${modeBadgeClassName}`}>
              {gameModeLabel}
            </span>
            {createdAtLabel ? (
              <span className="text-[9px] font-medium text-zinc-500">
                • {createdAtLabel}
              </span>
            ) : null}
            {isFull ? (
              <span className="shrink-0 rounded-[5px] border border-white/[0.08] bg-black/44 px-1.5 py-0.5 text-[9px] font-medium text-zinc-200">
                Filled
              </span>
            ) : null}
            {showActions && isOwner && returnPath ? (
              <LFGPostActionsMenu
                postId={post.id}
                returnPath={returnPath}
                viewHref={viewHref}
                viewLabel={viewLabel}
              />
            ) : showActions &&
              currentProfileId &&
              post.profileId &&
              !isOwner ? (
              <UserBlockMenu
                targetDisplayName={displayName}
                targetProfileId={post.profileId}
                targetUsername={post.author.username}
                viewProfileHref={profileHref}
              />
            ) : null}
          </div>

          {sectionLabel || statusPill ? (
            <div className="flex flex-wrap items-center gap-1">
              {sectionLabel ? (
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-600">
                  {sectionLabel}
                </p>
              ) : null}
              {statusPill}
            </div>
          ) : null}

          <div className="min-w-0 pt-1.5">
            <div className="flex min-w-0 flex-col items-start">
              <RankedAvatar
                avatarUrl={post.author.avatarUrl}
                className="-mt-[1.5rem] h-[48px] w-[48px] shrink-0 rounded-[10px] border-2 border-[var(--oc-bg-card)] shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
                displayName={visibleName}
                fallbackClassName="text-xs font-semibold text-zinc-100"
                fallbackText={visibleName.slice(0, 2).toUpperCase()}
                overlay={
                  post.profileId ? (
                    <PresenceIndicator
                      className="oc-overlay-avatar absolute bottom-0.5 right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
                      hideOfflinePresence={post.author.hideOfflinePresence}
                      isLookingToPlay={post.author.isLookingToPlay}
                      lastSeenAt={post.author.lastSeenAt}
                      sizeClassName="h-2.5 w-2.5"
                      userId={post.profileId}
                    />
                  ) : null
                }
                rankTier={post.rankTier}
                ringClassName="hidden"
              />
              <div className="min-w-0 pt-1.5">
                <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                  {profileHref ? (
                    <Link
                      href={profileHref}
                      className="truncate text-[14px] font-semibold tracking-[-0.02em] text-zinc-50 transition hover:text-white"
                    >
                      {displayName}
                    </Link>
                  ) : (
                    <p className="truncate text-[14px] font-semibold tracking-[-0.02em] text-zinc-50">
                      {displayName}
                    </p>
                  )}
                  {post.author.username ? (
                    profileHref ? (
                      <Link
                        href={profileHref}
                        className="truncate text-[11px] font-medium text-zinc-500 transition hover:text-zinc-300"
                      >
                        @{post.author.username}
                      </Link>
                    ) : (
                      <p className="truncate text-[11px] font-medium text-zinc-500">
                        @{post.author.username}
                      </p>
                    )
                  ) : null}
                  {post.author.badges.slice(0, 2).map((badge) => {
                    const badgePreset = getBadgePreset(badge.slug);
                    const badgeAssetSrc = getBadgeAssetSrc(badge.slug, badge.icon);

                    return badgePreset ? (
                      <span
                        key={badge.id}
                        className={`inline-flex items-center gap-1 rounded-[6px] border px-1.5 py-0.5 text-[9px] ${badgePreset.lfgClassName}`}
                      >
                        <badgePreset.Icon className={`h-3 w-3 shrink-0 ${badgePreset.iconClassName}`} />
                        {badge.label}
                      </span>
                    ) : badgeAssetSrc ? (
                      <span key={badge.id} title={badge.label} aria-label={badge.label} className="inline-flex h-4 items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={badgeAssetSrc} alt={badge.label} className="h-4 w-auto object-contain opacity-90" />
                      </span>
                    ) : (
                      <span key={badge.id} className="inline-flex h-4 items-center rounded-[7px] border border-white/[0.08] bg-white/[0.03] px-1.5 text-[9px] font-medium uppercase tracking-[0.08em] text-zinc-400">
                        {badge.label}
                      </span>
                    );
                  })}
                </div>

                <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-medium text-zinc-500">
                  {rankIconSrc ? (
                    <Image
                      src={rankIconSrc}
                      alt={`${rankLabel} rank icon`}
                      width={16}
                      height={16}
                      className="h-3.5 w-3.5 shrink-0 object-contain opacity-85"
                    />
                  ) : null}
                  <span className="text-zinc-300">{rankLabel}</span>
                  {post.region ? (
                    <>
                      <span aria-hidden="true" className="text-zinc-700">&bull;</span>
                      <span>{post.region}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-1.5 min-w-0">
            <h2 className="line-clamp-2 text-[15px] font-semibold leading-[1.3] tracking-[-0.025em] text-zinc-50">
              {post.title}
            </h2>
          </div>

          {availableRoleCounts.size > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {Array.from(availableRoleCounts.entries()).map(([role, count]) => (
                <span
                  key={role}
                  className={`inline-flex h-4 items-center rounded-[5px] border px-1.5 text-[9px] font-medium uppercase tracking-[0.05em] ${getRoleClassName(role)}`}
                >
                  {count} {COMPETITIVE_ROLE_LABELS[role]}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="min-w-0">
              <StackMemberAvatarStrip
                currentProfileId={currentProfileId}
                currentMemberCount={post.currentMemberCount}
                maxGroupSize={post.maxGroupSize}
                members={post.stackMembers}
                postId={post.id}
              />
            </div>
            {!isOwner && post.profileId && (!isFull || isMember) ? (
              <RequestToJoinButton
                lookingForRoles={post.lookingForRoles}
                postId={post.id}
                initialState={isMember ? "accepted" : requestState}
                viewerState={viewerState}
              />
            ) : isFull && !isOwner && !isMember ? (
              <span className="flex h-7 items-center rounded-[7px] border border-white/[0.08] bg-white/[0.028] px-2.5 text-[11px] font-medium text-zinc-500">
                Stack full
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
