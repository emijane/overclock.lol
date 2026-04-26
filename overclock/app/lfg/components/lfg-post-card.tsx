import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { getBadgeAssetSrc, getBadgePreset } from "@/lib/badges/badge-assets";
import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import { getLFGGameModeLabel, type LFGPost } from "@/lib/lfg/lfg-post-types";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";
import { formatPostDate } from "./format-post-date";
import { LFGPostActionsMenu } from "./lfg-post-actions-menu";

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
  const createdAtLabel = formatPostDate(post.createdAt);
  const gameModeLabel = getLFGGameModeLabel(post.gameMode);
  const visibleName = post.author.username ?? post.author.displayName ?? "Player";
  const profileHref = post.author.username ? `/u/${post.author.username}` : null;
  const avatarFallback = visibleName.slice(0, 2).toUpperCase();
  const isOwner = Boolean(currentProfileId && post.profileId === currentProfileId);

  return (
    <article className="rounded-[22px] border border-white/[0.07] bg-white/[0.035] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {sectionLabel || statusPill ? (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {sectionLabel ? (
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                    {sectionLabel}
                  </p>
                ) : null}
                {statusPill}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-200">
                {COMPETITIVE_ROLE_LABELS[post.postingRole]}
              </span>
              <h2 className="text-xl font-semibold tracking-[-0.035em] text-zinc-50">
                {post.title}
              </h2>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-400">
              <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-xs font-medium uppercase tracking-[0.08em] text-zinc-300">
                {gameModeLabel}
              </span>
              <span className="text-zinc-600">&bull;</span>
              <span>{rankLabel}</span>
              {post.region ? (
                <>
                  <span className="text-zinc-600">&bull;</span>
                  <span>
                    {post.region}
                    {post.timezone ? ` (${post.timezone})` : ""}
                  </span>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {createdAtLabel ? (
              <p className="whitespace-nowrap text-xs font-medium text-zinc-500">
                {createdAtLabel}
              </p>
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

        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-xs font-semibold text-zinc-100 shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
            {post.author.avatarUrl ? (
              <Image
                src={post.author.avatarUrl}
                alt={`${visibleName} avatar`}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              avatarFallback
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {profileHref ? (
                <Link
                  href={profileHref}
                  className="block truncate text-sm font-semibold text-zinc-100 transition hover:text-sky-300"
                >
                  @{post.author.username}
                </Link>
              ) : (
                <p className="truncate text-sm font-semibold text-zinc-100">
                  {visibleName}
                </p>
              )}
              {post.author.badges.map((badge) => {
                const badgePreset = getBadgePreset(badge.slug);
                const badgeAssetSrc = getBadgeAssetSrc(badge.slug, badge.icon);

                return badgePreset ? (
                  <span
                    key={badge.id}
                    className={`inline-flex items-center gap-1.5 rounded-full border ${badgePreset.lfgClassName}`}
                  >
                    <badgePreset.Icon
                      className={`h-3.5 w-3.5 shrink-0 ${badgePreset.iconClassName}`}
                    />
                    {badge.label}
                  </span>
                ) : badgeAssetSrc ? (
                  <span
                    key={badge.id}
                    title={badge.label}
                    aria-label={badge.label}
                    className="inline-flex h-6 items-center"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={badgeAssetSrc}
                      alt={badge.label}
                      className="h-6 w-auto object-contain"
                    />
                  </span>
                ) : (
                  <span
                    key={badge.id}
                    className="inline-flex h-6 items-center rounded-full bg-white/[0.06] px-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-300"
                  >
                    {badge.label}
                  </span>
                );
              })}
            </div>
            {post.author.displayName ? (
              <p className="truncate text-xs text-zinc-500">
                {post.author.displayName}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3">
        {post.heroPool.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-500">Hero Pool</p>
            <div className="flex flex-wrap gap-2.5">
              {post.heroPool.slice(0, 5).map((hero) => (
                <div
                  key={`${post.id}-${hero.id}`}
                  title={hero.label}
                  aria-label={hero.label}
                  className="relative h-10 w-10 overflow-hidden rounded-[12px] bg-zinc-900 shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
                >
                  {hero.imageSrc ? (
                    <Image
                      src={hero.imageSrc}
                      alt={hero.label}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
