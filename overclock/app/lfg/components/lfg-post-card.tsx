import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldIcon, SwordsIcon } from "lucide-react";

import { getBadgeAssetSrc, getBadgePreset } from "@/lib/badges/badge-assets";
import {
  getLFGGameModeLabel,
  getLFGLookingForRoleLabel,
  type LFGPost,
} from "@/lib/lfg/lfg-post-types";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";
import { formatPostDate } from "./format-post-date";
import { LFGPostActionsMenu } from "./lfg-post-actions-menu";

function SupportPlusIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <rect x="9.25" y="3.75" width="5.5" height="16.5" rx="1.2" />
      <rect x="3.75" y="9.25" width="16.5" height="5.5" rx="1.2" />
    </svg>
  );
}

function getRoleIcon(role: LFGPost["postingRole"]) {
  if (role === "tank") {
    return <ShieldIcon className="h-4 w-4 text-sky-300" />;
  }

  if (role === "dps") {
    return <SwordsIcon className="h-4 w-4 text-rose-300" />;
  }

  return <SupportPlusIcon className="h-4 w-4 text-emerald-300" />;
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
  const createdAtLabel = formatPostDate(post.createdAt);
  const gameModeLabel = getLFGGameModeLabel(post.gameMode);
  const visibleName = post.author.username ?? post.author.displayName ?? "Player";
  const profileHref = post.author.username ? `/u/${post.author.username}` : null;
  const avatarFallback = visibleName.slice(0, 2).toUpperCase();
  const isOwner = Boolean(currentProfileId && post.profileId === currentProfileId);

  return (
    <article className="rounded-[18px] border border-white/[0.08] bg-[#05070b] px-4 py-3 shadow-[0_14px_32px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="min-w-0 flex-1">
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
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-[10px] font-semibold text-zinc-100 shadow-[0_6px_16px_rgba(0,0,0,0.18)]">
                {post.author.avatarUrl ? (
                  <Image
                    src={post.author.avatarUrl}
                    alt={`${visibleName} avatar`}
                    fill
                    className="object-cover"
                    sizes="28px"
                  />
                ) : (
                  avatarFallback
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {profileHref ? (
                    <Link
                      href={profileHref}
                      className="block truncate text-sm font-semibold text-zinc-100 transition hover:text-sky-200"
                    >
                      @{post.author.username}
                    </Link>
                  ) : (
                    <p className="truncate text-sm font-semibold text-zinc-100">
                      {visibleName}
                    </p>
                  )}
                  {createdAtLabel ? (
                    <p className="whitespace-nowrap text-xs font-medium text-zinc-500">
                      {createdAtLabel}
                    </p>
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

            <div className="flex items-center gap-2">
              <span className="shrink-0 rounded-full bg-white/[0.08] px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-200">
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
          </div>

          <div className="flex min-w-0 items-start gap-1.5">
            <span className="mt-0.5 inline-flex h-[1.15rem] w-[1.15rem] shrink-0 items-center justify-center">
              {getRoleIcon(post.postingRole)}
            </span>
            <h2 className="min-w-0 text-[1.18rem] font-semibold leading-6 tracking-[-0.04em] text-zinc-50">
              {post.title}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-400">
            <span className="text-zinc-300">{rankLabel}</span>
            {post.region ? (
              <>
                <span className="text-zinc-600">&bull;</span>
                <span className="text-zinc-400">
                  {post.region}
                  {post.timezone ? ` (${post.timezone})` : ""}
                </span>
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span className="uppercase tracking-[0.08em] text-zinc-500">Looking for</span>
            {post.lookingForRoles.map((role) => (
              <span
                key={`${post.id}-looking-for-${role}`}
                className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-zinc-200"
              >
                {getLFGLookingForRoleLabel(role)}
              </span>
            ))}
          </div>

          {post.heroPool.length > 0 ? (
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
          ) : null}
        </div>
      </div>
    </article>
  );
}
