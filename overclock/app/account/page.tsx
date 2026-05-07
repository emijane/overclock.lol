import { redirect } from "next/navigation";

import { PageContainer } from "@/app/components/page-container";
import { AuthMessage } from "@/app/login/components";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

import { AvailabilityToggleCard } from "./availability-toggle-card";
import { PresencePrivacyToggleCard } from "./presence-privacy-toggle-card";
import { ProfileEditForm } from "./profile-edit-form";

type AccountPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
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

  const editProfile = {
    bio: profile.bio,
    discordUsername: profile.discord_username ?? null,
    displayName: profile.display_name,
    lookingFor: profile.looking_for ?? [],
    region: profile.region,
    returnTo: "/account",
    socials: {
      battlenet: profile.battlenet_handle ?? "",
      twitch: profile.twitch_url ?? "",
      x: profile.x_url ?? "",
      youtube: profile.youtube_url ?? "",
    },
    timezone: profile.timezone,
  };

  return (
    <main className="flex-1 bg-[#09090b] px-4 py-5 text-zinc-100 sm:px-6 sm:py-6">
      <PageContainer className="flex flex-col gap-4">
        <AuthMessage message={message} type={messageType} />

        <section className="rounded-[28px] border border-white/8 bg-[#05070b] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-6">
          <h1 className="text-2xl font-semibold tracking-[-0.045em] text-zinc-50">
            Account
          </h1>
        </section>

        <section className="rounded-[28px] border border-white/8 bg-[#05070b] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-6 sm:py-6">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Profile
          </h2>
          <ProfileEditForm profile={editProfile} />
        </section>

        <AvailabilityToggleCard
          initialIsLookingToPlay={profile.is_looking_to_play ?? false}
        />

        <PresencePrivacyToggleCard
          initialHideOfflinePresence={profile.hide_offline_presence ?? false}
        />
      </PageContainer>
    </main>
  );
}
