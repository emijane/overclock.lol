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
    <main className="relative flex-1 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_30%),radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.08),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.03),transparent_18%),#09090b] px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.7)_0.6px,transparent_0.95px)] bg-[length:11px_11px] opacity-68 [mask-image:radial-gradient(circle_at_34%_12%,black_0,black_12%,transparent_28%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(224,242,254,0.68)_0.6px,transparent_0.95px)] bg-[length:11px_11px] opacity-64 [mask-image:radial-gradient(circle_at_72%_62%,black_0,black_10%,transparent_24%)]"
      />
      <AuthMessage message={message} type={messageType} variant="toast" />
      <PageContainer
        className="relative z-10 flex flex-col gap-3"
        maxWidthClassName="max-w-4xl"
      >
        <section className="rounded-[28px]">
          <div className="overflow-hidden rounded-[28px]">
            <CompetitiveProfileHeader />
            <div className="rounded-[28px] border border-white/[0.08] bg-[#05070b] shadow-[0_24px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)] ring-1 ring-white/5">
              <CompetitiveProfileManager
                competitiveProfile={competitiveProfile}
                heroSelections={heroPools.heroPicks}
              />
            </div>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
