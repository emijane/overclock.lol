import { redirect } from "next/navigation";

import { CompetitiveProfileHeader } from "@/app/account/competitive/components/competitive-profile-header";
import { CompetitiveProfileManager } from "@/app/account/competitive/components/competitive-profile-manager";
import { PageContainer } from "@/app/components/page-container";
import { AuthMessage } from "@/app/login/components";
import { getCompetitiveProfile } from "@/lib/competitive/competitive-profile";
import { getProfileHeroPools } from "@/lib/heroes/profile-hero-pools";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

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
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/onboarding");
  }

  const competitiveProfile = await getCompetitiveProfile(profile.id);
  const heroPools = await getProfileHeroPools(profile.id);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-zinc-100 sm:px-6 sm:py-6">
      <PageContainer className="flex flex-col gap-4">
        <AuthMessage message={message} type={messageType} />
        <div className="rounded-[28px] border border-white/10 bg-white/[0.025] p-px shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="overflow-hidden rounded-[27px] bg-zinc-950">
            <CompetitiveProfileHeader />
            <CompetitiveProfileManager
              competitiveProfile={competitiveProfile}
              heroSelections={heroPools.heroPicks}
            />
          </div>
        </div>
      </PageContainer>
    </main>
  );
}
