import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { RankedAvatar } from "@/app/components/ranked-avatar";
import { getBadgeAssetSrc, getBadgePreset } from "@/lib/badges/badge-assets";
import { getRankAccentStyle } from "@/lib/competitive/rank-border-styles";
import { getRankIconSrc } from "@/lib/competitive/rank-icons";
import {
  getLFGGameModeLabel,
  getLFGLookingForRoleLabel,
  type LFGPost,
} from "@/lib/lfg/lfg-post-types";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";
import { formatPostDate } from "./format-post-date";
import { LFGPostActionsMenu } from "./lfg-post-actions-menu";

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
  currentProfileId?: string | null;
  post: LFGPost;
  returnPath?: string;
  sectionLabel?: string | null;
  showActions?: boolean;
  statusPill?: ReactNode;
  viewHref?: string;
  viewLabel?: string;
};

export function LFGPostCard({
  currentProfileId,
  post,
  returnPath,
  sectionLabel,
  showActions = true,
  statusPill,
  viewHref,
  viewLabel,
}: LFGPostCardProps) {
  const rankLabel = formatCurrentRank(post.rankTier, post.rankDivision);
  const rankedRoleLabel = `${rankLabel} ${getPostingRoleLabel(post.postingRole)}`;
  const rankIconSrc = getRankIconSrc(post.rankTier);
  const rankAccentStyle = getRankAccentStyle(post.rankTier);
  const createdAtLabel = formatPostDate(post.createdAt);
  const gameModeLabel = getLFGGameModeLabel(post.gameMode);
  const displayName = post.author.displayName ?? post.author.username ?? "Player";
  const visibleName = post.author.username ?? post.author.displayName ?? "Player";
  const profileHref = post.author.username ? `/u/${post.author.username}` : null;
  const isOwner = Boolean(currentProfileId && post.profileId === currentProfileId);

  return (
    <article
      className="rounded-[18px] bg-[var(--profile-rank-border)] p-px shadow-[0_0_20px_var(--profile-rank-glow)]"
      style={rankAccentStyle}
    >
      <div className="min-w-0 flex-1 rounded-[17px] bg-[#05070b] px-4 py-3 shadow-[0_14px_32px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.04)] ring-1 ring-white/[0.05]">
        <div className="flex flex-col gap-2.5">
          {sectionLabel || statusPill ? (
            <div className="flex flex-wrap items-center gap-2">
              {sectionLabel ? (
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                  {sectionLabel}
                </p>
              ) : null}
              {statusPill}
            </div>
          ) : null}

          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3.5">
              <RankedAvatar
                avatarUrl={post.author.avatarUrl}
                className="h-[72px] w-[72px] shrink-0"
                displayName={visibleName}
                fallbackClassName="text-lg font-semibold text-zinc-100"
                fallbackText={visibleName.slice(0, 2).toUpperCase()}
                rankTier={post.rankTier}
                ringClassName="-inset-[1.5px] opacity-75"
              />
              <div className="min-w-0">
                <div className="flex min-w-0 flex-col">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {profileHref ? (
                      <Link
                        href={profileHref}
                        className="block truncate text-sm font-semibold text-zinc-100 transition hover:text-sky-200"
                      >
                        {displayName}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-semibold text-zinc-100">
                        {displayName}
                      </p>
                    )}
                    {post.author.username ? (
                      profileHref ? (
                        <Link
                          href={profileHref}
                          className="block truncate text-xs font-medium text-zinc-500 transition hover:text-zinc-300"
                        >
                          @{post.author.username}
                        </Link>
                      ) : (
                        <p className="truncate text-xs font-medium text-zinc-500">
                          @{post.author.username}
                        </p>
                      )
                    ) : null}
                    {post.author.badges.map((badge) => {
                      const badgePreset = getBadgePreset(badge.slug);
                      const badgeAssetSrc = getBadgeAssetSrc(badge.slug, badge.icon);

                      return badgePreset ? (
                        <span
                          key={badge.id}
                          className={`inline-flex items-center gap-1 rounded-full border ${badgePreset.lfgClassName}`}
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
                          className="inline-flex h-5 items-center"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={badgeAssetSrc}
                            alt={badge.label}
                            className="h-5 w-auto object-contain"
                          />
                        </span>
                      ) : (
                        <span
                          key={badge.id}
                          className="inline-flex h-5 items-center rounded-full bg-white/[0.05] px-2 text-[9px] font-medium uppercase tracking-[0.1em] text-zinc-300/85"
                        >
                          {badge.label}
                        </span>
                      );
                    })}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-zinc-400">
                    {rankIconSrc ? (
                      <Image
                        src={rankIconSrc}
                        alt={`${rankedRoleLabel} rank icon`}
                        width={18}
                        height={18}
                        className="h-[18px] w-[18px] shrink-0 object-contain"
                      />
                    ) : null}
                    <span className="text-zinc-300">{rankedRoleLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded-full bg-white/[0.08] px-2 py-[3px] text-[10px] font-medium text-zinc-200">
                  {gameModeLabel}
                </span>
                {showActions && isOwner && returnPath ? (
                  <LFGPostActionsMenu
                    postId={post.id}
                    returnPath={returnPath}
                    viewHref={viewHref}
                    viewLabel={viewLabel}
                  />
                ) : null}
              </div>
              {createdAtLabel ? (
                <p className="text-right text-xs font-medium text-zinc-500">
                  {createdAtLabel}
                </p>
              ) : null}
            </div>
          </div>

          <div className="min-w-0">
            <h2 className="min-w-0 text-[1.18rem] font-semibold leading-6 tracking-[-0.04em] text-zinc-50">
              {post.title}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            {post.lookingForRoles.map((role) => (
              <span
                key={`${post.id}-looking-for-${role}`}
                className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 font-medium tracking-[-0.01em] text-zinc-100"
              >
                LF {getLFGLookingForRoleLabel(role)}
              </span>
            ))}
          </div>

          {post.heroPool.length > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-medium text-zinc-500">
                Hero pool
              </p>
              <div className="flex flex-wrap gap-2">
                {post.heroPool.slice(0, 5).map((hero) => (
                  <div
                    key={`${post.id}-${hero.id}`}
                    title={hero.label}
                    aria-label={hero.label}
                    className="relative h-8 w-8 overflow-hidden rounded-[10px] bg-zinc-900 shadow-[0_6px_16px_rgba(0,0,0,0.16)]"
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
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
