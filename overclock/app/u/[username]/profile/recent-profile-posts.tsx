import Link from "next/link";
import { ShieldIcon, SwordsIcon } from "lucide-react";

import { closeLFGPost } from "@/app/lfg/actions";
import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import type { LFGPost } from "@/lib/lfg/lfg-post-types";
import { ClosePostButton } from "@/app/lfg/components/close-post-button";

type RecentProfilePostsProps = {
  isOwner: boolean;
  posts: LFGPost[];
  profileUsername: string;
};

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

function formatPostDate(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  const now = Date.now();

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const diffMs = now - date.getTime();

  if (diffMs < 60_000) {
    return "just now";
  }

  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getRoleIcon(role: LFGPost["postingRole"]) {
  if (role === "tank") {
    return <ShieldIcon className="h-3.5 w-3.5 text-sky-300" />;
  }

  if (role === "dps") {
    return <SwordsIcon className="h-3.5 w-3.5 text-rose-300" />;
  }

  return <SupportPlusIcon className="h-3.5 w-3.5 text-emerald-300" />;
}

export function RecentProfilePosts({
  isOwner,
  posts,
  profileUsername,
}: RecentProfilePostsProps) {
  if (posts.length === 0 && !isOwner) {
    return null;
  }

  return (
    <section className="border-t border-white/10 px-5 pb-6 pt-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:px-6 sm:pb-7">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-zinc-50">
            Active Listings
          </h2>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="mt-3 rounded-[18px] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-zinc-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          Your active LFG listings will show up here.
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {posts.map((post) => {
            const rankLabel = post.rankTier;
            const createdAtLabel = formatPostDate(post.createdAt);
            const visibleHeroes = post.heroPool.slice(0, 3);

            return (
              <article
                key={post.id}
                className="flex h-full min-h-[154px] flex-col rounded-[18px] border border-white/10 bg-white/[0.03] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              >
                <h3 className="truncate text-sm font-medium text-zinc-100">
                  {post.title}
                </h3>

                <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span
                    className="inline-flex items-center gap-1.5 font-medium text-zinc-200"
                    title={COMPETITIVE_ROLE_LABELS[post.postingRole]}
                    aria-label={COMPETITIVE_ROLE_LABELS[post.postingRole]}
                  >
                    {getRoleIcon(post.postingRole)}
                  </span>
                  <span className="text-zinc-400">{rankLabel}</span>
                  {createdAtLabel ? (
                    <>
                      <span className="text-zinc-600">&bull;</span>
                      <span className="text-zinc-500">{createdAtLabel}</span>
                    </>
                  ) : null}
                </div>

                {visibleHeroes.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {visibleHeroes.map((hero) => (
                      <span
                        key={`${post.id}-${hero.id}`}
                        className="inline-flex h-7 items-center rounded-full border border-white/[0.05] bg-white/[0.02] px-3 text-xs font-medium text-zinc-400"
                      >
                        {hero.label}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-auto pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/${post.lfgType}`}
                      className="inline-flex text-xs font-semibold text-sky-300 transition hover:text-sky-200"
                    >
                      View Listing
                    </Link>
                    {isOwner ? (
                      <form action={closeLFGPost}>
                        <input type="hidden" name="post_id" value={post.id} />
                        <input
                          type="hidden"
                          name="return_path"
                          value={`/u/${profileUsername}`}
                        />
                        <ClosePostButton />
                      </form>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
