import Link from "next/link";
import { redirect } from "next/navigation";

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

const TABS = [
  { key: "profile", label: "Profile" },
  { key: "presence", label: "Presence" },
  { key: "safety", label: "Safety" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function isValidTab(value: string | undefined): value is TabKey {
  return TABS.some((t) => t.key === value);
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = searchParams ? await searchParams : {};
  const message = pickValue(params.message);
  const messageType = pickValue(params.type);
  const rawTab = pickValue(params.tab);
  const activeTab: TabKey = isValidTab(rawTab) ? rawTab : "profile";
  const { user, profile } = await getCurrentProfile();

  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");

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
    <>
      <AuthMessage message={message} type={messageType} variant="toast" />

      <PageReveal variant="fade">
      <div className="flex shrink-0 items-center justify-between px-5 py-3 sm:px-6">
        <h1 className="oc-profile-display text-[18px] font-bold tracking-[-0.03em] text-zinc-50">
          Account
        </h1>
        <nav aria-label="Account sections" className="flex items-center gap-1">
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <Link
                key={tab.key}
                href={tab.key === "profile" ? "/account" : `/account?tab=${tab.key}`}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex h-7 items-center rounded-[10px] border px-2.5 font-mono text-[11px] font-medium transition ${
                  isActive
                    ? "border-white/[0.1] bg-white/[0.07] text-zinc-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    : "border-transparent text-zinc-500 hover:border-white/[0.06] hover:bg-white/[0.03] hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/[0.05]" />

      {activeTab === "profile" && (
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
      )}

      {activeTab === "presence" && (
        <div className="divide-y divide-white/[0.05]">
          <AvailabilityToggleCard
            initialIsLookingToPlay={profile.is_looking_to_play ?? false}
          />
          <PresencePrivacyToggleCard
            initialHideOfflinePresence={profile.hide_offline_presence ?? false}
          />
        </div>
      )}

      {activeTab === "safety" && <AccountBlockedUsersCard />}
      </PageReveal>
    </>
  );
}
