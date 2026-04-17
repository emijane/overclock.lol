import { redirect } from "next/navigation";

import { CompetitiveProfileHeader } from "@/app/account/competitive/components/competitive-profile-header";
import { CompetitiveProfileManager } from "@/app/account/competitive/components/competitive-profile-manager";
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
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <AuthMessage message={message} type={messageType} />
        <CompetitiveProfileHeader />
        <CompetitiveProfileManager
          competitiveProfile={competitiveProfile}
          heroSelections={heroPools.heroPicks}
        />
      </div>
    </main>
  );
}
