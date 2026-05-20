import { redirect } from "next/navigation";

import { CompetitiveProfileHeader } from "@/app/account/competitive/components/competitive-profile-header";
import { CompetitiveProfileManager } from "@/app/account/competitive/components/competitive-profile-manager";
import { DarkPageShell } from "@/components/app-shell/dark-page-shell";
import { PageReveal } from "@/components/app-shell/page-reveal";
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
    <DarkPageShell
      containerClassName="flex flex-col gap-3"
      maxWidthClassName="max-w-4xl"
    >
      <AuthMessage message={message} type={messageType} variant="toast" />
        <section className="rounded-[28px]">
          <div className="overflow-hidden rounded-[28px]">
            <PageReveal>
              <CompetitiveProfileHeader />
            </PageReveal>
            <PageReveal delay={1}>
              <div className="oc-surface-panel rounded-[28px] ring-1 ring-white/5">
                <CompetitiveProfileManager
                  competitiveProfile={competitiveProfile}
                  heroSelections={heroPools.heroPicks}
                />
              </div>
            </PageReveal>
          </div>
        </section>
    </DarkPageShell>
  );
}
