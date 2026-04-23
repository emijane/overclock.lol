import Image from "next/image";

import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import { getRankIconSrc } from "@/lib/competitive/rank-icons";
import type { LFGPost } from "@/lib/lfg/lfg-post-types";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";

type LFGPostListProps = {
  emptyStateDescription: string;
  emptyStateTitle: string;
  posts: LFGPost[];
};

function LFGFeedPlaceholder({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="grid min-h-[280px] place-items-center rounded-[20px] border border-dashed border-white/12 bg-white/[0.02] px-5 py-10 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-zinc-400">
          <span className="text-lg">?</span>
        </span>
        <h2 className="mt-4 text-base font-semibold text-zinc-100">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
      </div>
    </div>
  );
}

export function LFGPostList({
  emptyStateDescription,
  emptyStateTitle,
  posts,
}: LFGPostListProps) {
  if (posts.length === 0) {
    return (
      <section className="border-t border-white/10 px-5 py-5 sm:px-6 sm:py-6">
        <LFGFeedPlaceholder
          description={emptyStateDescription}
          title={emptyStateTitle}
        />
      </section>
    );
  }

  return (
    <section className="border-t border-white/10 px-5 py-5 sm:px-6 sm:py-6">
      <div className="grid gap-3">
        {posts.map((post) => {
          const rankIconSrc = getRankIconSrc(post.rankTier);
          const rankLabel = formatCurrentRank(post.rankTier, post.rankDivision);

          return (
            <article
              key={post.id}
              className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-zinc-50">
                    {post.title}
                  </h2>
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

                <div className="flex items-center gap-3">
                  {rankIconSrc ? (
                    <Image
                      src={rankIconSrc}
                      alt={`${rankLabel} rank icon`}
                      width={36}
                      height={36}
                      className="h-9 w-9 object-contain"
                    />
                  ) : null}
                </div>
              </div>

              {post.heroPool.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2.5 border-t border-white/8 pt-3">
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
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
