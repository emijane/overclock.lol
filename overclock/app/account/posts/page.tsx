import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountPageHeader } from "@/app/account/components/account-page-header";
import { AccountSectionCard } from "@/app/account/components/account-section-card";
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
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

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

  const { user, profile } = await getCurrentProfile();

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

      <AccountPageHeader
        title="My posts"
        description="Review active, closed, and expired listings without leaving your account workspace."
        actions={
          <Link
            href="/duos/create"
            className="oc-profile-display inline-flex h-8 items-center rounded-[10px] border border-white/[0.06] bg-white/[0.03] px-3 text-[12px] font-semibold text-zinc-300 transition hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-zinc-100"
          >
            Create post
          </Link>
        }
      />

      <AccountSectionCard
        title="Post history"
        description="Filter your listing history by lifecycle state and manage anything that is still live."
        className="flex h-270 flex-col overflow-hidden"
        contentClassName="flex min-h-0 flex-1 flex-col p-0"
      >
        <AccountPostTabs counts={counts} selectedStatus={selectedStatus} />

        <div className="flex min-h-0 flex-1 flex-col px-5 py-4 sm:px-6">
          {paginatedPosts.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="rounded-[18px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.008)_100%)] px-5 py-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <p className="oc-profile-display text-sm font-medium text-zinc-200">
                  {emptyState.title}
                </p>
                <p className="mt-1.5 max-w-md text-sm leading-6 text-zinc-500">
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
      </AccountSectionCard>
    </>
  );
}
