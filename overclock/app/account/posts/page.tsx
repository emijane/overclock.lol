import Link from "next/link";
import { redirect } from "next/navigation";

import { PageReveal } from "@/components/app-shell/page-reveal";

import { AccountPostCard } from "@/app/account/posts/components/account-post-card";
import { AccountPostPagination } from "@/app/account/posts/components/account-post-pagination";
import { AccountPostTabs } from "@/app/account/posts/components/account-post-tabs";
import { AuthMessage } from "@/features/auth/components";
import {
  getLFGPostDisplayStatus,
  isLFGPostDisplayStatus,
  type LFGPostDisplayStatus,
} from "@/lib/lfg/lfg-post-display-status";
import { getAccountPostsPageDto } from "@/lib/pages/account-posts-page-dto";
import { getCurrentProfileIdentity } from "@/lib/profiles/get-current-profile";

type AccountPostsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

type TabValue = "all" | LFGPostDisplayStatus;

function getSelectedStatus(value: string | undefined): TabValue {
  if (!value || value === "all") return "all";
  return isLFGPostDisplayStatus(value) ? value : "all";
}

function getEmptyStateCopy(status: TabValue) {
  if (status === "active") {
    return {
      description: "Live listings will show up here until you close them or they expire.",
      title: "No active posts",
    };
  }
  if (status === "closed") {
    return {
      description: "Posts you close manually will show up here for your own reference.",
      title: "No closed posts",
    };
  }
  if (status === "expired") {
    return {
      description: "Posts that have expired or been closed will show up here.",
      title: "No expired posts",
    };
  }
  return {
    description: "Your active, closed, and expired listings will show up here once you start posting.",
    title: "You haven't created any posts yet.",
  };
}

export default async function AccountPostsPage({
  searchParams,
}: AccountPostsPageProps) {
  const params = searchParams ? await searchParams : {};
  const message = pickValue(params.message);
  const messageType = pickValue(params.type);
  const selectedStatus = getSelectedStatus(pickValue(params.status));
  const currentPage = Math.max(1, Number(pickValue(params.page)) || 1);

  const { user, profile } = await getCurrentProfileIdentity();

  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");

  const dto = await getAccountPostsPageDto({
    currentPage,
    profileId: profile.id,
    selectedStatus,
  });
  const counts: Record<TabValue, number> = dto.counts;
  const totalPages = dto.pagination.totalPages;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedPosts = dto.posts;

  const emptyState = getEmptyStateCopy(selectedStatus);

  return (
    <>
      <AuthMessage message={message} type={messageType} variant="toast" />

      <PageReveal variant="fade">
      <div className="flex shrink-0 items-center justify-between px-5 py-3 sm:px-6">
        <h1 className="oc-profile-display text-[18px] font-bold tracking-[-0.03em] text-zinc-50">
          My posts
        </h1>
        <Link
          href="/duos/create"
          className="inline-flex h-7 items-center rounded-[10px] border border-white/6 bg-white/3 px-2.5 font-mono text-[11px] font-medium text-zinc-400 transition hover:border-white/10 hover:bg-white/5 hover:text-zinc-200"
        >
          Create post
        </Link>
      </div>

      <div className="border-t border-white/5" />

      <AccountPostTabs counts={counts} selectedStatus={selectedStatus} />

      <div className="px-5 py-4 sm:px-6">
        {paginatedPosts.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <div className="text-center">
              <p className="font-mono text-[13px] font-medium text-zinc-400">
                {emptyState.title}
              </p>
              <p className="mt-1.5 max-w-sm font-mono text-[11px] leading-5 text-zinc-600">
                {emptyState.description}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-2">
              {paginatedPosts.map((post) => {
                const displayStatus =
                  post.displayStatus ?? getLFGPostDisplayStatus(post);
                return (
                  <AccountPostCard
                    key={post.id}
                    displayStatus={displayStatus}
                    post={post}
                    showActions={displayStatus === "active"}
                  />
                );
              })}
            </div>
            <AccountPostPagination
              currentPage={safePage}
              selectedStatus={selectedStatus}
              totalPages={totalPages}
            />
          </>
        )}
      </div>
      </PageReveal>
    </>
  );
}
