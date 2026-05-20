import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import { DarkPageShell } from "@/components/app-shell/dark-page-shell";
import { AuthMessage } from "@/features/auth/components";
import { AccountPostCard } from "@/app/account/posts/components/account-post-card";
import { AccountPostPagination } from "@/app/account/posts/components/account-post-pagination";
import { AccountPostTabs } from "@/app/account/posts/components/account-post-tabs";
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

export default async function AccountPostsPage({ searchParams }: AccountPostsPageProps) {
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
    <DarkPageShell
      containerClassName="flex flex-col gap-3"
      maxWidthClassName="max-w-4xl"
    >
        <AuthMessage message={message} type={messageType} />

        <section className="oc-surface-panel flex h-270 flex-col overflow-hidden rounded-[22px]">
          <header className="shrink-0 px-5 py-4 sm:px-6 sm:py-5">
            <div className="space-y-2">
              <Link
                href="/account"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 transition hover:text-zinc-300"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5 shrink-0" />
                Account
              </Link>
              <h1 className="text-3xl font-semibold tracking-[-0.07em] text-zinc-50 sm:text-4xl">
                My Posts
              </h1>
            </div>
          </header>

          <AccountPostTabs counts={counts} selectedStatus={selectedStatus} />

          <div className="flex min-h-0 flex-1 flex-col px-5 py-4 sm:px-6">
            {paginatedPosts.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <p className="text-sm font-medium text-zinc-300">
                    {emptyState.title}
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-zinc-500">
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
        </section>
    </DarkPageShell>
  );
}
