import { redirect } from "next/navigation";

import { CompetitiveProfileHeader } from "@/app/account/competitive/components/competitive-profile-header";
import { CompetitiveRoleCardList } from "@/app/account/competitive/components/competitive-role-card-list";
import { getCompetitiveProfile } from "@/lib/competitive/competitive-profile";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

export default async function CompetitiveProfilePage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/onboarding");
  }

  const competitiveProfile = await getCompetitiveProfile(profile.id);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-zinc-100 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <CompetitiveProfileHeader />
        <CompetitiveRoleCardList competitiveProfile={competitiveProfile} />
      </div>
    </main>
  );
}
