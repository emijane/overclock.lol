import Link from "next/link";

import type { LFGPost } from "@/lib/lfg/lfg-post-types";
import { LFGPostCard } from "./lfg-post-card";

type LFGPostListProps = {
  currentProfileId?: string | null;
  emptyStateDescription: string;
  emptyStateTitle: string;
  errorMessage?: string | null;
  hasActiveFilters?: boolean;
  posts: LFGPost[];
  retryHref?: string;
};

function LFGFeedPlaceholder({
  ctaHref,
  ctaLabel,
  description,
  title,
}: {
  ctaHref?: string;
  ctaLabel?: string;
  description: string;
  title: string;
}) {
  return (
    <div className="grid min-h-[280px] place-items-center rounded-[20px] border border-white/[0.07] bg-[#05070b] px-5 py-10 text-center shadow-[0_16px_36px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="max-w-sm">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-white/[0.05] text-zinc-400">
          <span className="text-lg">?</span>
        </span>
        <h2 className="mt-4 text-base font-semibold text-zinc-100">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
        {ctaHref && ctaLabel ? (
          <Link
            href={ctaHref}
            className="mt-5 inline-flex h-10 items-center rounded-full bg-white/[0.07] px-4 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.11] hover:text-zinc-50"
          >
            {ctaLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function LFGPostList({
  currentProfileId,
  emptyStateDescription,
  emptyStateTitle,
  errorMessage,
  hasActiveFilters = false,
  posts,
  retryHref,
}: LFGPostListProps) {
  if (errorMessage) {
    return (
      <section className="px-5 py-2 sm:px-6 sm:py-3">
        <LFGFeedPlaceholder
          ctaHref={retryHref}
          ctaLabel="Reload Section"
          description={`${errorMessage} Reload this section to try again.`}
          title="Unable to load this feed"
        />
      </section>
    );
  }

  if (posts.length === 0) {
    return (
      <section className="px-5 py-2 sm:px-6 sm:py-3">
        <LFGFeedPlaceholder
          description={
            hasActiveFilters
              ? "No posts match the filters you have selected right now. Try widening your filters or clear all to see more listings."
              : emptyStateDescription
          }
          title={hasActiveFilters ? "No matching posts" : emptyStateTitle}
        />
      </section>
    );
  }

  return (
    <section className="px-5 py-2 sm:px-6 sm:py-3">
      <div className="grid gap-3">
        {posts.map((post) => {
          return (
            <LFGPostCard
              key={post.id}
              currentProfileId={currentProfileId}
              post={post}
              returnPath={`/${post.lfgType}`}
            />
          );
        })}
      </div>
    </section>
  );
}
