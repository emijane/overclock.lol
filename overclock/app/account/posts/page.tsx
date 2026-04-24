import { redirect } from "next/navigation";

import { PageContainer } from "@/app/components/page-container";
import { AuthMessage } from "@/app/login/components";
import { LFGPostCard } from "@/app/lfg/components/lfg-post-card";
import { LFGPostStatusPill } from "@/app/lfg/components/lfg-post-status-pill";
import { getLFGPostDisplayStatus } from "@/lib/lfg/lfg-post-display-status";
import { getPostsByProfileId } from "@/lib/lfg/posts";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

type AccountPostsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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
              {posts.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-white/12 bg-white/[0.02] px-5 py-10 text-center">
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
