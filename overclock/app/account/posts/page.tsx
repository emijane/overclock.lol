import { redirect } from "next/navigation";

import { PageContainer } from "@/app/components/page-container";
import { AuthMessage } from "@/app/login/components";
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
          <div className="rounded-[22px] border border-dashed border-zinc-800 bg-zinc-950/60 px-5 py-10 text-center">
            <p className="text-sm font-medium text-zinc-200">
              Your posts will show up here.
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Active, closed, and expired listings will be filterable from this
              page in the next step.
            </p>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
