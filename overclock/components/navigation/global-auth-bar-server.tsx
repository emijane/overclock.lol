import { GlobalAuthBar } from "@/components/navigation/global-auth-bar";
import { getNotificationsMenuDto } from "@/lib/pages/matches-page-dto";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";
import { getProfileAvatarUrl } from "@/lib/profiles/profile-media";

export async function GlobalAuthBarServer() {
  const { user, profile } = await getCurrentProfile();
  const initialNotifications = profile
    ? await getNotificationsMenuDto(profile.id)
    : null;

  return (
    <GlobalAuthBar
      initialNotifications={initialNotifications}
      profile={
        profile
          ? {
              avatar_url: getProfileAvatarUrl(
                profile.avatar_url ?? null,
                profile.avatar_updated_at ?? null
              ),
              display_name: profile.display_name ?? null,
              username: profile.username,
            }
          : null
      }
      userId={user?.id ?? null}
    />
  );
}
