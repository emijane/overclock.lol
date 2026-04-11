import { redirect } from "next/navigation";

import { AuthMessage } from "@/app/login/components";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";
import { HeroPoolsBuilder } from "@/app/account/hero-pools/hero-pools-builder";
import { getProfileHeroPools } from "@/lib/heroes/profile-hero-pools";

type HeroPoolsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HeroPoolsPage({
  searchParams,
}: HeroPoolsPageProps) {
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

  const heroPools = await getProfileHeroPools(user.id);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-zinc-100 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <AuthMessage message={message} type={messageType} />
        <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 px-5 py-5 sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Setup
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-zinc-50">
            Hero Pools
          </h1>
        </section>

        <HeroPoolsBuilder
          initialHeroSelections={heroPools.heroPicks}
          initialRoles={heroPools.roles}
        />
      </div>
    </main>
  );
}
