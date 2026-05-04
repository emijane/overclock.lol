import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { RankedAvatar } from "@/app/components/ranked-avatar";
import { getBadgeAssetSrc, getBadgePreset } from "@/lib/badges/badge-assets";
import { getRankIconSrc } from "@/lib/competitive/rank-icons";
import { getLFGGameModeLabel, type LFGPost } from "@/lib/lfg/lfg-post-types";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";
import { formatPostDate } from "./format-post-date";
import { LFGPostActionsMenu } from "./lfg-post-actions-menu";

function getModeBadgeClassName(gameMode: LFGPost["gameMode"]) {
  if (gameMode === "quick_play") {
    return "border-amber-300/12 bg-amber-300/[0.08] text-amber-100/90";
  }

  return "border-sky-300/12 bg-sky-300/[0.08] text-sky-100/90";
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
  returnPath?: string;
  sectionLabel?: string | null;
  showActions?: boolean;
  statusPill?: ReactNode;
  tone?: "default" | "duos";
  viewHref?: string;
  viewLabel?: string;
};

export function LFGPostCard({
  cardClassName,
  currentProfileId,
  post,
  returnPath,
  sectionLabel,
  showActions = true,
  statusPill,
  tone = "default",
  viewHref,
  viewLabel,
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
  const outerBorderClassName =
    tone === "duos" ? "border-white/[0.12]" : "border-[#12161d]";
  const innerRingClassName =
    tone === "duos" ? "ring-white/[0.08]" : "ring-white/[0.05]";
  const coverBorderClassName =
    tone === "duos" ? "border-white/[0.08]" : "border-white/[0.05]";

  return (
    <article
      className={`group h-full rounded-[22px] border ${outerBorderClassName} bg-[#05070b] shadow-[0_16px_36px_rgba(0,0,0,0.26)]${
        cardClassName ? ` ${cardClassName}` : ""
      }`}
    >
      <div className={`relative flex h-full min-w-0 flex-col overflow-hidden rounded-[21px] bg-[#05070b] ring-1 ${innerRingClassName}`}>
        <div className={`relative h-20 overflow-hidden border-b ${coverBorderClassName} bg-zinc-950`}>
          {post.author.coverImageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.author.coverImageUrl}
                alt=""
                className="h-full w-full object-cover brightness-50"
              />
            </>
          ) : null}
        </div>

        <div className="relative z-10 flex flex-1 flex-col px-4 pb-3.5 pt-2">
          <div className="absolute left-4 top-0 z-20">
            <RankedAvatar
              avatarUrl={post.author.avatarUrl}
              className="-mt-[3.35rem] h-[84px] w-[84px] shrink-0 rounded-full border-[3px] border-[#05070b] shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
              displayName={visibleName}
              fallbackClassName="text-sm font-semibold text-zinc-100"
              fallbackText={visibleName.slice(0, 2).toUpperCase()}
              rankTier={post.rankTier}
              ringClassName="hidden"
            />
          </div>
          <div className="absolute right-4 top-2.5 z-20 flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-2">
              {post.platform ? (
                <span className="inline-flex items-center rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[9px] font-semibold text-zinc-100 backdrop-blur-sm">
                  {post.platform}
                </span>
              ) : null}
              <span
                className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-semibold ${modeBadgeClassName}`}
              >
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
              <p className="text-right text-[10px] font-medium text-zinc-700">
                Posted {createdAtLabel}
              </p>
            ) : null}
          </div>

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

          <div className="min-w-0 pt-8">
            <div className="flex min-w-0 flex-col">
              {profileHref ? (
                <Link
                  href={profileHref}
                  className="block truncate text-[15px] font-semibold tracking-[-0.02em] text-zinc-50 transition hover:text-white"
                >
                  {displayName}
                </Link>
              ) : (
                <p className="truncate text-[15px] font-semibold tracking-[-0.02em] text-zinc-50">
                  {displayName}
                </p>
              )}
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
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
            </div>
          </div>

          <div className="mt-2 min-w-0">
            <h2 className="line-clamp-2 min-h-[3rem] text-[16px] font-semibold leading-6 tracking-[-0.02em] text-zinc-100">
              {post.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] font-semibold text-zinc-300">
              {rankIconSrc ? (
                <Image
                  src={rankIconSrc}
                  alt={`${rankedRoleLabel} rank icon`}
                  width={18}
                  height={18}
                  className="h-4 w-4 shrink-0 object-contain opacity-95"
                />
              ) : null}
              <span className="text-zinc-200">{rankLabel}</span>
              <span aria-hidden="true" className="text-zinc-600">
                &bull;
              </span>
              <span className="text-zinc-300">{postingRoleLabel}</span>
            </div>
          </div>

          {post.heroPool.length > 0 ? (
            <div className="mt-auto flex flex-wrap gap-2 pt-3">
                {post.heroPool.slice(0, 5).map((hero) => (
                  <div
                    key={`${post.id}-${hero.id}`}
                    title={hero.label}
                    aria-label={hero.label}
                    className="relative h-8 w-8 overflow-hidden rounded-[10px] bg-zinc-900/90 shadow-[0_6px_16px_rgba(0,0,0,0.16)] transition-transform duration-150 ease-out hover:scale-105"
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
          ) : null}
        </div>
      </div>
    </article>
  );
}
