import { ShieldIcon, SwordsIcon } from "lucide-react";

import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import {
  getLFGLookingForRoleLabel,
  type LFGPost,
} from "@/lib/lfg/lfg-post-types";
import { LFGPostActionsMenu } from "@/app/lfg/components/lfg-post-actions-menu";

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
    <section className="border-t border-white/[0.06] px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-zinc-100">
            Active Listings
          </h2>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="mt-4 rounded-[18px] border border-white/8 bg-white/2 px-4 py-3 text-sm text-zinc-500">
          Your active LFG listings will show up here.
        </div>
      ) : (
        <div className="mt-4 grid gap-2.5 md:grid-cols-2">
          {posts.map((post) => {
            const rankLabel = post.rankTier;
            const createdAtLabel = formatPostDate(post.createdAt);

            return (
              <article
                key={post.id}
                className="rounded-[18px] border border-white/8 bg-white/4 p-3.5 transition-colors duration-200 hover:bg-white/6"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="truncate pr-1.5 text-[14px] font-semibold tracking-[-0.01em] text-zinc-100">
                    {post.title}
                  </h3>
                  {isOwner ? (
                    <LFGPostActionsMenu
                      allowClose={false}
                      manageLabel="Manage Posts"
                      postId={post.id}
                      returnPath={`/u/${profileUsername}`}
                      viewHref={`/${post.lfgType}`}
                      viewLabel="View Post"
                    />
                  ) : null}
                </div>

                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-white/65">
                  <span
                    className="inline-flex items-center gap-1.5 font-medium text-zinc-200"
                    title={COMPETITIVE_ROLE_LABELS[post.postingRole]}
                    aria-label={COMPETITIVE_ROLE_LABELS[post.postingRole]}
                  >
                    {getRoleIcon(post.postingRole)}
                  </span>
                  <span>{rankLabel}</span>
                  {createdAtLabel ? (
                    <>
                      <span className="text-zinc-700">&bull;</span>
                      <span className="text-zinc-500">{createdAtLabel}</span>
                    </>
                  ) : null}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-400">
                  {post.lookingForRoles.map((role) => (
                    <span
                      key={`${post.id}-recent-looking-for-${role}`}
                      className="rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 font-medium tracking-[-0.01em] text-zinc-100"
                    >
                      LF {getLFGLookingForRoleLabel(role)}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
