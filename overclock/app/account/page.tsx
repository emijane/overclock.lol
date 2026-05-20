import { redirect } from "next/navigation";

import { DarkPageShell } from "@/components/app-shell/dark-page-shell";
import { PageReveal } from "@/components/app-shell/page-reveal";
import { AccountBlockedUsersCard } from "@/features/blocks/components/account-blocked-users-card";
import { AuthMessage } from "@/features/auth/components";
import { ProfileEditForm } from "@/features/profile/components/profile-edit-form";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";
import { getProfileAvatarUrl, getProfileCoverUrl } from "@/lib/profiles/profile-media";

import { AvailabilityToggleCard } from "./availability-toggle-card";
import { PresencePrivacyToggleCard } from "./presence-privacy-toggle-card";

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
    <DarkPageShell
      containerClassName="flex flex-col gap-3"
      maxWidthClassName="max-w-4xl"
    >
        <section className="rounded-[28px]">
          <div className="overflow-hidden rounded-[28px]">
            <PageReveal>
              <header className="py-4 sm:py-5">
                <AuthMessage message={message} type={messageType} />
                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.07em] text-zinc-50 sm:text-4xl">
                  Account
                </h1>
              </header>
            </PageReveal>

            <PageReveal delay={1}>
              <div className="grid gap-3">
                <div className="oc-surface-panel overflow-hidden rounded-[22px]">
                  <ProfileEditForm
                    avatarUrl={getProfileAvatarUrl(
                      profile.avatar_url ?? null,
                      profile.avatar_updated_at ?? null
                    )}
                    coverImageUrl={getProfileCoverUrl(
                      profile.cover_image_path ?? null,
                      profile.cover_image_updated_at ?? null
                    )}
                    profile={editProfile}
                  />
                </div>

                <div className="oc-surface-panel overflow-hidden rounded-[22px]">
                  <AvailabilityToggleCard
                    initialIsLookingToPlay={profile.is_looking_to_play ?? false}
                  />
                  <div className="border-t border-white/6" />
                  <PresencePrivacyToggleCard
                    initialHideOfflinePresence={profile.hide_offline_presence ?? false}
                  />
                </div>

                <AccountBlockedUsersCard />
              </div>
            </PageReveal>
          </div>
        </section>
    </DarkPageShell>
  );
}
