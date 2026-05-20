import Image from "next/image";

import { formatPostDate } from "@/features/lfg/components/format-post-date";
import { LFGPostActionsMenu } from "@/features/lfg/components/lfg-post-actions-menu";
import { LFGPostStatusPill } from "@/features/lfg/components/lfg-post-status-pill";
import { getRankIconSrc } from "@/lib/competitive/rank-icons";
import type { LFGPostDisplayStatus } from "@/lib/lfg/lfg-post-display-status";
import { getLFGGameModeLabel, type LFGPost } from "@/lib/lfg/lfg-post-types";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";

type AccountPostCardPost = Pick<
  LFGPost,
  | "createdAt"
  | "gameMode"
  | "heroPool"
  | "id"
  | "lfgType"
  | "postingRole"
  | "rankDivision"
  | "rankTier"
  | "title"
>;

function getRoleLabel(role: LFGPost["postingRole"]) {
  if (role === "tank") return "Tank";
  if (role === "dps") return "DPS";
  return "Support";
}

function Dot() {
  return (
    <span aria-hidden="true" className="text-[10px] text-zinc-700">
      &bull;
    </span>
  );
}

type AccountPostCardProps = {
  displayStatus: LFGPostDisplayStatus;
  post: AccountPostCardPost;
  showActions?: boolean;
};

export function AccountPostCard({
  displayStatus,
  post,
  showActions = false,
}: AccountPostCardProps) {
  const rankLabel = formatCurrentRank(post.rankTier, post.rankDivision);
  const rankIconSrc = getRankIconSrc(post.rankTier);
  const gameModeLabel = getLFGGameModeLabel(post.gameMode);
  const roleLabel = getRoleLabel(post.postingRole);
  const sectionLabel = post.lfgType.charAt(0).toUpperCase() + post.lfgType.slice(1);
  const createdAtLabel = formatPostDate(post.createdAt);
  const isActive = displayStatus === "active";

  return (
    <article
      className={`rounded-[18px] border bg-[#05070b] transition-all duration-150 ${
        isActive
          ? "border-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-white/14 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_6px_20px_rgba(0,0,0,0.24)]"
          : "border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
      }`}
    >
      <div className="px-4 py-3">
        {/* Title row: title left, status + actions right, all center-aligned */}
        <div className="flex items-center gap-2">
          <p
            className={`min-w-0 flex-1 truncate text-[14px] font-semibold leading-5 tracking-[-0.02em] ${
              isActive ? "text-zinc-100" : "text-zinc-500"
            }`}
          >
            {post.title}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <LFGPostStatusPill status={displayStatus} />
            {showActions ? (
              <LFGPostActionsMenu
                postId={post.id}
                returnPath="/account/posts"
                viewHref={`/${post.lfgType}`}
                viewLabel={`Open ${sectionLabel}`}
              />
            ) : null}
          </div>
        </div>

        {/* Metadata row: rank · role · mode · section · time — heroes pinned right */}
        <div className="mt-1.5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
            {rankIconSrc ? (
              <Image
                src={rankIconSrc}
                alt=""
                width={13}
                height={13}
                className={`h-3.25 w-3.25 shrink-0 object-contain transition-opacity ${
                  isActive ? "opacity-90" : "opacity-35"
                }`}
              />
            ) : null}
            <span
              className={`text-[11px] font-semibold ${
                isActive ? "text-zinc-300" : "text-zinc-600"
              }`}
            >
              {rankLabel}
            </span>
            <Dot />
            <span
              className={`text-[11px] ${isActive ? "text-zinc-500" : "text-zinc-700"}`}
            >
              {roleLabel}
            </span>
            <Dot />
            <span
              className={`text-[11px] ${isActive ? "text-zinc-500" : "text-zinc-700"}`}
            >
              {gameModeLabel}
            </span>
            <Dot />
            <span
              className={`text-[11px] ${isActive ? "text-zinc-500" : "text-zinc-700"}`}
            >
              {sectionLabel}
            </span>
            {createdAtLabel ? (
              <>
                <Dot />
                <span
                  className={`text-[11px] ${
                    isActive ? "text-zinc-600" : "text-zinc-700"
                  }`}
                >
                  {createdAtLabel}
                </span>
              </>
            ) : null}
          </div>

          {post.heroPool.length > 0 ? (
            <div className="flex shrink-0 items-center gap-0.5">
              {post.heroPool.slice(0, 4).map((hero) => (
                <div
                  key={hero.id}
                  title={hero.label}
                  aria-label={hero.label}
                  className={`relative h-5.5 w-5.5 overflow-hidden rounded-md bg-zinc-900 ring-1 ring-inset transition-opacity ${
                    isActive ? "opacity-100 ring-white/8" : "opacity-35 ring-white/4"
                  }`}
                >
                  {hero.imageSrc ? (
                    <Image
                      src={hero.imageSrc}
                      alt={hero.label}
                      fill
                      className="object-cover"
                      sizes="22px"
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
