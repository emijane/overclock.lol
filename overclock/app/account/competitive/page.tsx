import Link from "next/link";
import { redirect } from "next/navigation";

import { PageReveal } from "@/components/app-shell/page-reveal";
import { AuthMessage } from "@/features/auth/components";
import { getCompetitiveProfile } from "@/lib/competitive/competitive-profile";
import { getProfileHeroPools } from "@/lib/heroes/profile-hero-pools";
import { getCurrentProfileIdentity } from "@/lib/profiles/get-current-profile";

import { CompetitiveProfileManager } from "./components/competitive-profile-manager";

type CompetitiveProfilePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CompetitiveProfilePage({
  searchParams,
}: CompetitiveProfilePageProps) {
  const params = searchParams ? await searchParams : {};
  const message = pickValue(params.message);
  const messageType = pickValue(params.type);
  const { user, profile } = await getCurrentProfileIdentity();

  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");

  const [competitiveProfile, heroPools] = await Promise.all([
    getCompetitiveProfile(profile.id),
    getProfileHeroPools(profile.id),
  ]);

  return (
    <>
      <AuthMessage message={message} type={messageType} variant="toast" />

      <PageReveal variant="fade">
        <div className="flex shrink-0 items-center justify-between px-5 py-3 sm:px-6">
          <h1 className="oc-profile-display text-[18px] font-bold tracking-[-0.03em] text-zinc-50">
            Competitive
          </h1>
          <Link
            href="/duos/create"
            className="inline-flex h-7 items-center rounded-[10px] border border-white/6 bg-white/3 px-2.5 font-mono text-[11px] font-medium text-zinc-400 transition hover:border-white/10 hover:bg-white/5 hover:text-zinc-200"
          >
            Create post
          </Link>
        </div>

        <div className="border-t border-white/5" />

        <CompetitiveProfileManager
          competitiveProfile={competitiveProfile}
          heroSelections={heroPools.heroPicks}
        />
      </PageReveal>
    </>
  );
}
