import type { User } from "@supabase/supabase-js";

type UserMetadata = {
  avatar_url?: string;
  full_name?: string;
  global_name?: string;
  name?: string;
  preferred_username?: string;
  provider_id?: string;
  user_name?: string;
  username?: string;
};

// Pulls Discord-related identity fields from the Supabase auth user metadata.
// We use this server-side so Discord-owned fields stay trusted and are not
// supplied by the browser.
export function getDiscordProfile(user: User) {
  const metadata = (user.user_metadata ?? {}) as UserMetadata;
  const discordUsernameCandidates = [
    metadata.full_name,
    metadata.name,
    metadata.username,
    metadata.user_name,
  ];
  const discordUsername =
    discordUsernameCandidates.find((value) => value && !value.includes("@")) ??
    null;

  return {
    avatarUrl: metadata.avatar_url ?? null,
    displayName:
      metadata.global_name ?? discordUsername ?? "Discord user",
    discordUsername,
    discordUserId: metadata.provider_id ?? null,
  };
}
