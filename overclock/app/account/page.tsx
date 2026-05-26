import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountPageHeader } from "@/app/account/components/account-page-header";
import { AccountSectionCard } from "@/app/account/components/account-section-card";
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
    <>
      <AuthMessage message={message} type={messageType} variant="toast" />

      <AccountPageHeader
        title="General"
        description="Update your public profile details, presence visibility, and account safety controls from one place."
        actions={
          <>
            <Link
              href="/account/competitive"
              className="oc-profile-display inline-flex h-8 items-center rounded-[10px] border border-white/[0.06] bg-white/[0.03] px-3 text-[12px] font-semibold text-zinc-300 transition hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-zinc-100"
            >
              Competitive profile
            </Link>
            <Link
              href="/account/posts"
              className="oc-profile-display inline-flex h-8 items-center rounded-[10px] border border-white/[0.06] bg-white/[0.03] px-3 text-[12px] font-semibold text-zinc-300 transition hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-zinc-100"
            >
              My posts
            </Link>
          </>
        }
      />

      <div className="grid gap-3">
        <AccountSectionCard
          title="Profile"
          description="Control the profile details and public links attached to your overclock.lol player page."
          contentClassName="p-0"
        >
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
        </AccountSectionCard>

        <AccountSectionCard
          title="Presence & Privacy"
          description="Set how visible your account is to other players when they browse, connect, or send invites."
          contentClassName="divide-y divide-white/[0.06]"
        >
          <AvailabilityToggleCard
            initialIsLookingToPlay={profile.is_looking_to_play ?? false}
          />
          <PresencePrivacyToggleCard
            initialHideOfflinePresence={profile.hide_offline_presence ?? false}
          />
        </AccountSectionCard>

        <AccountSectionCard
          title="Safety"
          description="Blocked users are hidden from invites, requests, and profile discovery on your account."
          contentClassName="p-0"
        >
          <AccountBlockedUsersCard />
        </AccountSectionCard>
      </div>
    </>
  );
}
