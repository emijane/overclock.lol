import type { User } from "@supabase/supabase-js";

type UserMetadata = {
  avatar_url?: string;
  full_name?: string;
  name?: string;
  preferred_username?: string;
  provider_id?: string;
  user_name?: string;
};

// Pulls Discord-related identity fields from the Supabase auth user metadata.
// We use this server-side so Discord-owned fields stay trusted and are not
// supplied by the browser.
export function getDiscordProfile(user: User) {
  const metadata = (user.user_metadata ?? {}) as UserMetadata;

  return {
    avatarUrl: metadata.avatar_url ?? null,
    displayName:
      metadata.full_name ??
      metadata.name ??
      metadata.preferred_username ??
      metadata.user_name ??
      user.email ??
      "Discord user",
    discordUsername:
      metadata.preferred_username ?? metadata.user_name ?? user.email ?? "",
    discordUserId: metadata.provider_id ?? null,
  };
}
