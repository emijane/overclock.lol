import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountPageHeader } from "@/app/account/components/account-page-header";
import { AccountSectionCard } from "@/app/account/components/account-section-card";
import { CompetitiveProfileManager } from "@/app/account/competitive/components/competitive-profile-manager";
import { AuthMessage } from "@/features/auth/components";
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
    <>
      <AuthMessage message={message} type={messageType} variant="toast" />

      <AccountPageHeader
        title="Competitive profile"
        description="Keep your platform, role ranks, and hero comfort picks ready for duos and stacks."
        actions={
          <Link
            href="/duos/create"
            className="oc-profile-display inline-flex h-8 items-center rounded-[10px] border border-white/[0.06] bg-white/[0.03] px-3 text-[12px] font-semibold text-zinc-300 transition hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-zinc-100"
          >
            Create post
          </Link>
        }
      />

      <AccountSectionCard
        title="Role setup"
        description="Choose your platform, review configured roles, and update the rank and hero pool attached to each role."
        contentClassName="p-0"
      >
        <CompetitiveProfileManager
          competitiveProfile={competitiveProfile}
          heroSelections={heroPools.heroPicks}
        />
      </AccountSectionCard>
    </>
  );
}
