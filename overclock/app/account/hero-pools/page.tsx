import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/profiles/get-current-profile";
import { HeroPoolsBuilder } from "@/app/account/hero-pools/hero-pools-builder";

export default async function HeroPoolsPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-zinc-100 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 px-5 py-5 sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Setup
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-zinc-50">
            Hero Pools
          </h1>
        </section>

        <HeroPoolsBuilder />
      </div>
    </main>
  );
}
