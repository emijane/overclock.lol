import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { PresenceIndicator } from "@/components/presence/presence-indicator";
import { RankedAvatar } from "@/app/components/ranked-avatar";
import { getBadgeAssetSrc, getBadgePreset } from "@/lib/badges/badge-assets";
import { getRankIconSrc } from "@/lib/competitive/rank-icons";
import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import { getLFGGameModeLabel, type LFGPost } from "@/lib/lfg/lfg-post-types";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";
import { formatPostDate } from "./format-post-date";
import { LFGPostActionsMenu } from "./lfg-post-actions-menu";
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
    return "border-white/[0.08] bg-white/[0.04] text-zinc-300";
  }
  return "border-white/[0.08] bg-white/[0.04] text-zinc-300";
}

function getRoleClassName(role: CompetitiveRole) {
  if (role === "tank") return "border-white/[0.08] bg-white/[0.03] text-zinc-300";
  if (role === "dps") return "border-white/[0.08] bg-white/[0.03] text-zinc-300";
  return "border-white/[0.08] bg-white/[0.03] text-zinc-300";
}

function getPostingRoleLabel(role: LFGPost["postingRole"]) {
  if (role === "tank") return "Tank";
  if (role === "dps") return "DPS";
  return "Support";
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
  const postingRoleLabel = getPostingRoleLabel(post.postingRole);
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
      className={`group h-full rounded-[16px] border border-white/[0.08] bg-[#06070a] shadow-[0_10px_26px_rgba(0,0,0,0.2)] transition-[border-color,transform,box-shadow] duration-200 hover:border-white/[0.14] hover:shadow-[0_14px_30px_rgba(0,0,0,0.24)]${
        cardClassName ? ` ${cardClassName}` : ""
      }`}
    >
      <div className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-[15px] bg-[#06070a]">
        <div className="relative h-16 overflow-hidden bg-zinc-950/90">
          {post.author.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.author.coverImageUrl}
              alt=""
              className="h-full w-full object-cover brightness-[0.4] saturate-[0.72]"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-black/28 via-black/48 to-[#06070a]" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col px-3.5 pb-3 pt-2.5">
          <div className="absolute right-3.5 top-2.5 z-20 flex items-center gap-1.5">
            {createdAtLabel ? (
              <p suppressHydrationWarning className="hidden text-right text-[10px] font-medium text-zinc-600 sm:block">
                {createdAtLabel}
              </p>
            ) : null}
            <div className="flex items-center gap-2">
              {post.platform ? (
                <span className="inline-flex items-center rounded-[7px] border border-white/[0.08] bg-black/35 px-1.5 py-0.5 text-[9px] font-medium text-zinc-300">
                  {post.platform}
                </span>
              ) : null}
              <span className={`shrink-0 rounded-[7px] border px-1.5 py-0.5 text-[9px] font-medium ${modeBadgeClassName}`}>
                {gameModeLabel}
              </span>
              {isFull ? (
                <span className="shrink-0 rounded-[7px] border border-white/[0.08] bg-white/[0.05] px-1.5 py-0.5 text-[9px] font-medium text-zinc-200">
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
              ) : null}
            </div>
          </div>

          {sectionLabel || statusPill ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {sectionLabel ? (
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-600">
                  {sectionLabel}
                </p>
              ) : null}
              {statusPill}
            </div>
          ) : null}

          <div className="min-w-0 pt-2">
            <div className="flex min-w-0 flex-col items-start">
              <RankedAvatar
                avatarUrl={post.author.avatarUrl}
                className="-mt-[1.9rem] h-[56px] w-[56px] shrink-0 rounded-[14px] border-2 border-[#06070a] shadow-[0_0_0_1px_rgba(255,255,255,0.05)]"
                displayName={visibleName}
                fallbackClassName="text-xs font-semibold text-zinc-100"
                fallbackText={visibleName.slice(0, 2).toUpperCase()}
                overlay={
                  post.profileId ? (
                    <PresenceIndicator
                      className="absolute bottom-0.5 right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#06070a] shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
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
              <div className="min-w-0 pt-2">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
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
                        className={`inline-flex items-center gap-1 rounded-[7px] border px-1.5 py-0.5 text-[9px] ${badgePreset.lfgClassName}`}
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

                <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] font-medium text-zinc-500">
                  {rankIconSrc ? (
                    <Image
                      src={rankIconSrc}
                      alt={`${rankLabel} ${postingRoleLabel} rank icon`}
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
                <div className="mt-1 text-[11px] font-medium text-zinc-500">
                  {postingRoleLabel}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 min-w-0">
            <h2 className="line-clamp-2 text-[15px] font-semibold leading-5 tracking-[-0.025em] text-zinc-50">
              {post.title}
            </h2>
          </div>

          {availableRoleCounts.size > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {Array.from(availableRoleCounts.entries()).map(([role, count]) => (
                <span
                  key={role}
                  className={`inline-flex h-4.5 items-center rounded-[7px] border px-1.5 text-[9px] font-medium uppercase tracking-[0.06em] ${getRoleClassName(role)}`}
                >
                  {count} {COMPETITIVE_ROLE_LABELS[role]}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-auto flex flex-wrap items-end justify-between gap-2.5 pt-2.5">
            <div className="flex min-w-0 flex-col gap-2">
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
              <span className="flex h-7.5 items-center rounded-[8px] border border-white/[0.08] bg-white/[0.03] px-2.5 text-[11px] font-medium text-zinc-500">
                Stack full
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
