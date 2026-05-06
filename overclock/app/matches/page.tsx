import { redirect } from "next/navigation";

import { PageContainer } from "@/app/components/page-container";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

export default async function MatchesPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <main className="flex-1 bg-zinc-950 px-4 py-5 text-zinc-100 sm:px-6 sm:py-6">
      <PageContainer className="flex flex-col gap-4">
        <section className="rounded-[28px] border border-white/10 bg-white/[0.025] p-px shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="overflow-hidden rounded-[27px] bg-zinc-950">
            <header className="px-5 py-5 sm:px-6 sm:py-6">
              <h1 className="text-2xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-3xl">
                Matches
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Accepted play invites and pending outgoing invites will show up
                here.
              </p>
            </header>

            <section className="border-t border-white/10 px-5 py-5 sm:px-6 sm:py-6">
              <div className="rounded-[22px] border border-dashed border-white/12 bg-white/[0.02] px-5 py-10 text-center">
                <p className="text-sm font-medium text-zinc-200">
                  Matches are not live yet.
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  This page is the first landing spot for the invite-to-play
                  flow. We&apos;ll add active matches, pending sent invites, and
                  history in the next steps.
                </p>
              </div>
            </section>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
