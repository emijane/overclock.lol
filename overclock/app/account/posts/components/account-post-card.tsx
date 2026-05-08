import Image from "next/image";

import { LFGPostActionsMenu } from "@/app/lfg/components/lfg-post-actions-menu";
import { LFGPostStatusPill } from "@/app/lfg/components/lfg-post-status-pill";
import { formatPostDate } from "@/app/lfg/components/format-post-date";
import { getRankIconSrc } from "@/lib/competitive/rank-icons";
import type { LFGPostDisplayStatus } from "@/lib/lfg/lfg-post-display-status";
import { getLFGGameModeLabel, type LFGPost } from "@/lib/lfg/lfg-post-types";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";

function getRoleLabel(role: LFGPost["postingRole"]) {
  if (role === "tank") return "Tank";
  if (role === "dps") return "DPS";
  return "Support";
}

type AccountPostCardProps = {
  displayStatus: LFGPostDisplayStatus;
  post: LFGPost;
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

  return (
    <article className="rounded-[18px] border border-white/[0.07] bg-[#05070b] px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <p className="truncate text-sm font-semibold tracking-[-0.01em] text-zinc-100">
          {post.title}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
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
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <div className="flex items-center gap-1.5">
          {rankIconSrc ? (
            <Image
              src={rankIconSrc}
              alt=""
              width={14}
              height={14}
              className="h-3.5 w-3.5 shrink-0 object-contain opacity-85"
            />
          ) : null}
          <span className="text-xs font-medium text-zinc-400">{rankLabel}</span>
        </div>
        <span aria-hidden="true" className="text-zinc-700">&bull;</span>
        <span className="text-xs font-medium text-zinc-400">{roleLabel}</span>
        <span aria-hidden="true" className="text-zinc-700">&bull;</span>
        <span className="text-xs font-medium text-zinc-400">{gameModeLabel}</span>
        <span aria-hidden="true" className="text-zinc-700">&bull;</span>
        <span className="text-xs font-medium text-zinc-500">{sectionLabel}</span>
        {createdAtLabel ? (
          <>
            <span aria-hidden="true" className="text-zinc-700">&bull;</span>
            <span className="text-xs text-zinc-600">{createdAtLabel}</span>
          </>
        ) : null}
        {post.heroPool.length > 0 ? (
          <div className="ml-0.5 flex items-center gap-1">
            {post.heroPool.slice(0, 5).map((hero) => (
              <div
                key={hero.id}
                title={hero.label}
                aria-label={hero.label}
                className="relative h-5 w-5 overflow-hidden rounded-md bg-zinc-900"
              >
                {hero.imageSrc ? (
                  <Image
                    src={hero.imageSrc}
                    alt={hero.label}
                    fill
                    className="object-cover"
                    sizes="20px"
                  />
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
