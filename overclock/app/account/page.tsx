import { redirect } from "next/navigation";

import { PageContainer } from "@/components/app-shell/page-container";
import { PageReveal } from "@/components/app-shell/page-reveal";
import { AuthMessage } from "@/app/login/components";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";
import { getProfileAvatarUrl, getProfileCoverUrl } from "@/lib/profiles/profile-media";

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
    <main className="relative flex-1 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_30%),radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.08),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.03),transparent_18%),#09090b] px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.7)_0.6px,transparent_0.95px)] bg-size-[11px_11px] opacity-68 mask-[radial-gradient(circle_at_34%_12%,black_0,black_12%,transparent_28%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(224,242,254,0.68)_0.6px,transparent_0.95px)] bg-size-[11px_11px] opacity-64 mask-[radial-gradient(circle_at_72%_62%,black_0,black_10%,transparent_24%)]"
      />
      <PageContainer className="relative z-10 flex flex-col gap-3" maxWidthClassName="max-w-4xl">
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
                <div className="overflow-hidden rounded-[22px] border border-white/8 bg-[#05070b] shadow-[0_24px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)]">
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

                <div className="overflow-hidden rounded-[22px] border border-white/8 bg-[#05070b] shadow-[0_24px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <AvailabilityToggleCard
                    initialIsLookingToPlay={profile.is_looking_to_play ?? false}
                  />
                  <div className="border-t border-white/6" />
                  <PresencePrivacyToggleCard
                    initialHideOfflinePresence={profile.hide_offline_presence ?? false}
                  />
                </div>
              </div>
            </PageReveal>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
