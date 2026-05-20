import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { PresenceIndicator } from "@/components/presence/presence-indicator";
import { UserBlockMenu } from "@/features/blocks/components/user-block-controls";
import { getBadgeAssetSrc, getBadgePreset } from "@/lib/badges/badge-assets";
import { getRankIconSrc } from "@/lib/competitive/rank-icons";
import { getLFGGameModeLabel, type LFGPost } from "@/lib/lfg/lfg-post-types";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";
import { RankedAvatar } from "@/components/profile/ranked-avatar";
import { formatPostDate } from "./format-post-date";
import { LFGInviteButton } from "./lfg-invite-button";
import { LFGPostActionsMenu } from "./lfg-post-actions-menu";
import type {
  InviteViewerState,
  ProfileInviteState,
} from "@/lib/matches/play-invite-types";

function getModeBadgeClassName(gameMode: LFGPost["gameMode"]) {
  if (gameMode === "quick_play") {
    return "border-white/[0.07] bg-black/44 text-zinc-300";
  }

  return "border-white/[0.07] bg-black/44 text-zinc-300";
}

function getPostingRoleLabel(role: LFGPost["postingRole"]) {
  if (role === "tank") {
    return "Tank";
  }

  if (role === "dps") {
    return "DPS";
  }

  return "Support";
}

type LFGPostCardProps = {
  cardClassName?: string;
  currentProfileId?: string | null;
  post: LFGPost;
  inviteState?: ProfileInviteState;
  onInviteSent?: (profileId: string) => void;
  returnPath?: string;
  sectionLabel?: string | null;
  showActions?: boolean;
  statusPill?: ReactNode;
  tone?: "default" | "duos";
  viewHref?: string;
  viewLabel?: string;
  viewerState?: InviteViewerState;
};

export function LFGPostCard({
  cardClassName,
  currentProfileId,
  post,
  inviteState = "invite_to_play",
  onInviteSent,
  returnPath,
  sectionLabel,
  showActions = true,
  statusPill,
  tone = "default",
  viewHref,
  viewLabel,
  viewerState = "guest",
}: LFGPostCardProps) {
  const rankLabel = formatCurrentRank(post.rankTier, post.rankDivision);
  const postingRoleLabel = getPostingRoleLabel(post.postingRole);
  const rankedRoleLabel = `${rankLabel} ${postingRoleLabel}`;
  const rankIconSrc = getRankIconSrc(post.rankTier);
  const modeBadgeClassName = getModeBadgeClassName(post.gameMode);
  const createdAtLabel = formatPostDate(post.createdAt);
  const gameModeLabel = getLFGGameModeLabel(post.gameMode);
  const displayName = post.author.displayName ?? post.author.username ?? "Player";
  const visibleName = post.author.username ?? post.author.displayName ?? "Player";
  const profileHref = post.author.username ? `/u/${post.author.username}` : null;
  const isOwner = Boolean(currentProfileId && post.profileId === currentProfileId);
  const article = (
    <article
      aria-label={post.title}
      className={`group h-full rounded-[12px] ${
        tone === "duos"
          ? "oc-card-lift"
          : "oc-surface-solid-lift"
      }${
        cardClassName ? ` ${cardClassName}` : ""
      }`}
    >
      <div className={`relative flex h-full min-w-0 flex-col overflow-hidden rounded-[11px] ${
        tone === "duos" ? "bg-transparent" : "bg-[var(--oc-bg-card)]"
      }`}>
        <div className={`relative h-14 overflow-hidden ${tone === "duos" ? "bg-[#111113]" : "bg-zinc-950/95"}`}>
          {post.author.coverImageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.author.coverImageUrl}
                alt=""
                className="h-full w-full object-cover brightness-[0.28] saturate-[0.56] opacity-80"
              />
            </>
          ) : null}
          <div className={`absolute inset-0 bg-gradient-to-b from-black/24 via-black/44 ${tone === "duos" ? "to-[var(--oc-bg-elevated)]" : "to-[var(--oc-bg-card)]"}`} />
          <div className={`absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent ${tone === "duos" ? "to-[var(--oc-bg-elevated)]" : "to-[var(--oc-bg-card)]"}`} />
        </div>

        <div className="relative z-10 flex flex-1 flex-col px-3 pb-3 pt-2">
          <div className="absolute left-3 top-0 z-20">
            <RankedAvatar
              avatarUrl={post.author.avatarUrl}
              className={`-mt-[1.5rem] h-[48px] w-[48px] shrink-0 rounded-[10px] border-2 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] ${
                tone === "duos" ? "border-[#090909]" : "border-[var(--oc-bg-card)]"
              }`}
              displayName={visibleName}
              fallbackClassName="text-xs font-semibold text-zinc-100"
              fallbackText={visibleName.slice(0, 2).toUpperCase()}
              overlay={
                post.profileId ? (
                  <PresenceIndicator
                    className={`absolute bottom-0.5 right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full shadow-[0_0_0_1px_rgba(255,255,255,0.06)] ${
                      tone === "duos" ? "oc-overlay-avatar-elevated" : "oc-overlay-avatar"
                    }`}
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
          </div>
          <div className="absolute right-3 top-2 z-20 flex items-center gap-1">
              {post.platform ? (
                <span className="oc-profile-meta inline-flex h-4.5 items-center rounded-[5px] border border-white/[0.06] bg-black/40 px-1.5 text-[9px] font-medium text-zinc-300">
                  {post.platform}
                </span>
              ) : null}
              <span
                className={`oc-profile-meta shrink-0 rounded-[5px] border px-1.5 py-0.5 text-[9px] font-medium ${modeBadgeClassName}`}
              >
                {gameModeLabel}
              </span>
              {createdAtLabel ? (
                <span suppressHydrationWarning className="oc-profile-meta text-[9px] font-medium">
                  {createdAtLabel}
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
                <p className="oc-profile-meta text-[10px] font-medium uppercase tracking-[0.14em]">
                  {sectionLabel}
                </p>
              ) : null}
              {statusPill}
            </div>
          ) : null}

          <div className="min-w-0 pt-3.5">
            <div className="flex min-w-0 flex-col items-start">
              <div className="min-w-0 pt-2.5">
                <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                  {profileHref ? (
                    <Link
                      href={profileHref}
                      className="oc-profile-display truncate text-[15px] font-semibold tracking-[-0.02em] text-zinc-50 transition hover:text-white"
                    >
                      {displayName}
                    </Link>
                  ) : (
                    <p className="oc-profile-display truncate text-[15px] font-semibold tracking-[-0.02em] text-zinc-50">
                      {displayName}
                    </p>
                  )}
                  {post.author.username ? (
                    profileHref ? (
                      <Link
                        href={profileHref}
                        className="oc-profile-meta truncate text-[11px] font-medium transition hover:text-zinc-300"
                      >
                        @{post.author.username}
                      </Link>
                    ) : (
                      <p className="oc-profile-meta truncate text-[11px] font-medium">
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
                        <badgePreset.Icon
                          className={`h-3 w-3 shrink-0 ${badgePreset.iconClassName}`}
                        />
                        {badge.label}
                      </span>
                    ) : badgeAssetSrc ? (
                      <span
                        key={badge.id}
                        title={badge.label}
                        aria-label={badge.label}
                        className="inline-flex h-4 items-center"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={badgeAssetSrc}
                          alt={badge.label}
                          className="h-4 w-auto object-contain opacity-90"
                        />
                      </span>
                    ) : (
                      <span
                        key={badge.id}
                        className="inline-flex h-4 items-center rounded-[7px] border border-white/[0.08] bg-white/[0.03] px-1.5 text-[9px] font-medium uppercase tracking-[0.08em] text-zinc-400"
                      >
                        {badge.label}
                      </span>
                    );
                  })}
                </div>

                <div className="oc-profile-meta mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-medium">
                  {rankIconSrc ? (
                    <Image
                      src={rankIconSrc}
                      alt={`${rankedRoleLabel} rank icon`}
                      width={16}
                      height={16}
                      className="h-3.5 w-3.5 shrink-0 object-contain opacity-85"
                    />
                  ) : null}
                  <span className="text-zinc-300">{rankLabel}</span>
                  <span aria-hidden="true" className="text-zinc-700">
                    &bull;
                  </span>
                  <span>{postingRoleLabel}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-1 min-w-0">
            <h2 className="oc-profile-display line-clamp-2 min-h-[2.6rem] text-[15px] font-semibold leading-[1.3] tracking-[-0.025em] text-zinc-50">
              {post.title}
            </h2>
          </div>

          {post.heroPool.length > 0 || tone === "duos" || !isOwner ? (
            <div className="mt-auto flex items-end justify-between gap-3 pt-2.5">
              <div className="flex flex-wrap gap-1.5">
                {post.heroPool.slice(0, 5).map((hero) => (
                  <div
                    key={`${post.id}-${hero.id}`}
                    title={hero.label}
                    aria-label={hero.label}
                    className={`relative h-8 w-8 overflow-hidden rounded-[8px] border border-white/[0.06] ${
                      tone === "duos" ? "bg-zinc-900/80" : "bg-zinc-900/90 shadow-[0_5px_12px_rgba(0,0,0,0.14)]"
                    }`}
                  >
                    {hero.imageSrc ? (
                      <Image
                        src={hero.imageSrc}
                        alt={hero.label}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
              {!isOwner && post.profileId ? (
                <LFGInviteButton
                  initialState={inviteState}
                  onInviteSent={onInviteSent}
                  recipientProfileId={post.profileId}
                  sourceLFGPostId={post.id}
                  tone={tone}
                  viewerState={viewerState}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );

  return article;
}
