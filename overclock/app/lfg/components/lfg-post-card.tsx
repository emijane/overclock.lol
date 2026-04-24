import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { getBadgeAssetSrc, getBadgePreset } from "@/lib/badges/badge-assets";
import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import type { LFGPost } from "@/lib/lfg/lfg-post-types";
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
};

export function LFGPostCard({
  currentProfileId,
  post,
  returnPath,
  sectionLabel,
  showActions = true,
  statusPill,
}: LFGPostCardProps) {
  const rankLabel = formatCurrentRank(post.rankTier, post.rankDivision);
  const createdAtLabel = formatPostDate(post.createdAt);
  const visibleName = post.author.username ?? post.author.displayName ?? "Player";
  const profileHref = post.author.username ? `/u/${post.author.username}` : null;
  const avatarFallback = visibleName.slice(0, 2).toUpperCase();
  const isOwner = Boolean(currentProfileId && post.profileId === currentProfileId);

  return (
    <article className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {sectionLabel || statusPill ? (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {sectionLabel ? (
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                  {sectionLabel}
                </p>
              ) : null}
              {statusPill}
            </div>
          ) : (
            <div className="mb-3 flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-zinc-900 text-xs font-semibold text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
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
                        className="inline-flex h-6 items-center rounded-full border border-white/10 bg-white/[0.035] px-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-300"
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
          )}

          <h2 className="text-base font-semibold text-zinc-50">{post.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-400">
            <span className="font-medium text-zinc-200">
              {COMPETITIVE_ROLE_LABELS[post.postingRole]}
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

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {createdAtLabel ? (
            <p className="text-xs font-medium text-zinc-500">{createdAtLabel}</p>
          ) : null}
          {showActions && isOwner && returnPath ? (
            <LFGPostActionsMenu postId={post.id} returnPath={returnPath} />
          ) : null}
        </div>
      </div>

      <div className="mt-3 border-t border-white/8 pt-3">
        {post.heroPool.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-500">Hero Pool</p>
            <div className="flex flex-wrap gap-2.5">
              {post.heroPool.slice(0, 5).map((hero) => (
                <div
                  key={`${post.id}-${hero.id}`}
                  title={hero.label}
                  aria-label={hero.label}
                  className="relative h-10 w-10 overflow-hidden rounded-[12px] border border-white/10 bg-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
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
