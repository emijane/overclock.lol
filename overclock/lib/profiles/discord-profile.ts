import type { User } from "@supabase/supabase-js";

type UserMetadata = {
  avatar_url?: string;
  full_name?: string;
  name?: string;
  preferred_username?: string;
  provider_id?: string;
  user_name?: string;
};

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
