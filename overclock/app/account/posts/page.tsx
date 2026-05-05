import { redirect } from "next/navigation";

import { PageContainer } from "@/app/components/page-container";
import { AuthMessage } from "@/app/login/components";
import { AccountPostStatusFilter } from "@/app/account/posts/components/account-post-status-filter";
import { LFGPostCard } from "@/app/lfg/components/lfg-post-card";
import { LFGPostStatusPill } from "@/app/lfg/components/lfg-post-status-pill";
import {
  getLFGPostDisplayStatus,
  isLFGPostDisplayStatus,
  type LFGPostDisplayStatus,
} from "@/lib/lfg/lfg-post-display-status";
import { getPostsByProfileId } from "@/lib/lfg/posts";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

type AccountPostsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

type AccountPostStatusFilterValue = "all" | LFGPostDisplayStatus;

function getSelectedStatusFilter(value: string | undefined): AccountPostStatusFilterValue {
  if (!value || value === "all") {
    return "all";
  }

  return isLFGPostDisplayStatus(value) ? value : "all";
}

function getEmptyStateCopy(statusFilter: AccountPostStatusFilterValue) {
  if (statusFilter === "active") {
    return {
      description: "Live listings will show up here until you close them or they expire.",
      title: "No active posts",
    };
  }

  if (statusFilter === "closed") {
    return {
      description: "Posts you close manually will show up here for your own reference.",
      title: "No closed posts",
    };
  }

  if (statusFilter === "expired") {
    return {
      description: "Posts older than the 12-hour active window will show up here.",
      title: "No expired posts",
    };
  }

  return {
    description:
      "Your active, closed, and expired listings will show up here once you start posting.",
    title: "You have not created any posts yet.",
  };
}

export default async function AccountPostsPage({
  searchParams,
}: AccountPostsPageProps) {
  const params = searchParams ? await searchParams : {};
  const message = pickValue(params.message);
  const messageType = pickValue(params.type);
  const selectedStatus = getSelectedStatusFilter(pickValue(params.status));
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/onboarding");
  }

  const posts = await getPostsByProfileId(profile.id);
  const filteredPosts = posts.filter((post) => {
    if (selectedStatus === "all") {
      return true;
    }

    return getLFGPostDisplayStatus(post) === selectedStatus;
  });
  const emptyState = getEmptyStateCopy(selectedStatus);

  return (
    <main className="flex-1 bg-zinc-950 px-4 py-5 text-zinc-100 sm:px-6 sm:py-6">
      <PageContainer className="flex flex-col gap-4">
        <AuthMessage message={message} type={messageType} />

        <section className="rounded-[28px] border border-white/10 bg-white/[0.025] p-px shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="overflow-hidden rounded-[27px] bg-zinc-950">
            <header className="px-5 py-5 sm:px-6 sm:py-6">
              <h1 className="text-2xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-3xl">
                My Posts
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Manage your active and past LFG listings in one place.
              </p>
            </header>

            <section className="border-t border-white/10 px-5 py-5 sm:px-6 sm:py-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                    Filter
                  </p>
                </div>
                <AccountPostStatusFilter selectedStatus={selectedStatus} />
              </div>

              {filteredPosts.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-white/12 bg-white/[0.02] px-5 py-10 text-center">
                  <p className="text-sm font-medium text-zinc-200">
                    {emptyState.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    {emptyState.description}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredPosts.map((post) => {
                    const displayStatus = getLFGPostDisplayStatus(post);

                    return (
                      <LFGPostCard
                        key={post.id}
                        currentProfileId={profile.id}
                        post={post}
                        returnPath="/account/posts"
                        sectionLabel={post.lfgType}
                        showActions={displayStatus === "active"}
                        statusPill={<LFGPostStatusPill status={displayStatus} />}
                        viewHref={`/${post.lfgType}`}
                        viewLabel={`Open ${post.lfgType.charAt(0).toUpperCase()}${post.lfgType.slice(1)}`}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
