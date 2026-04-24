import { redirect } from "next/navigation";

import { PageContainer } from "@/app/components/page-container";
import { AuthMessage } from "@/app/login/components";
import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import { getPostsByProfileId } from "@/lib/lfg/posts";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";

type AccountPostsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatPostDate(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function AccountPostsPage({
  searchParams,
}: AccountPostsPageProps) {
  const params = searchParams ? await searchParams : {};
  const message = pickValue(params.message);
  const messageType = pickValue(params.type);
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/onboarding");
  }

  const posts = await getPostsByProfileId(profile.id);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-zinc-100 sm:px-6 sm:py-6">
      <PageContainer className="flex flex-col gap-4">
        <AuthMessage message={message} type={messageType} />

        <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 px-5 py-5 sm:px-6">
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-zinc-50">
            My Posts
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Manage your active and past LFG listings in one place.
          </p>
        </section>

        <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
          {posts.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-zinc-800 bg-zinc-950/60 px-5 py-10 text-center">
              <p className="text-sm font-medium text-zinc-200">
                You have not created any posts yet.
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Your active, closed, and expired listings will show up here once
                you start posting.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {posts.map((post) => {
                const createdAtLabel = formatPostDate(post.createdAt);
                const rankLabel = formatCurrentRank(post.rankTier, post.rankDivision);

                return (
                  <article
                    key={post.id}
                    className="rounded-[22px] border border-white/10 bg-zinc-950/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                          {post.lfgType}
                        </p>
                        <h2 className="mt-2 text-base font-semibold text-zinc-50">
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

                      {createdAtLabel ? (
                        <p className="text-xs font-medium text-zinc-500">
                          {createdAtLabel}
                        </p>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </PageContainer>
    </main>
  );
}
