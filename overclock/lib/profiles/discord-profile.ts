import type { User } from "@supabase/supabase-js";

type UserMetadata = {
  accent_color?: number | string;
  avatar_url?: string;
  banner?: string;
  banner_url?: string;
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

  const accentColorValue = metadata.accent_color;
  const discordAccentColor =
    typeof accentColorValue === "number"
      ? `#${accentColorValue.toString(16).padStart(6, "0")}`
      : typeof accentColorValue === "string" && accentColorValue.trim().length > 0
        ? accentColorValue.startsWith("#")
          ? accentColorValue
          : `#${accentColorValue}`
        : null;

  return {
    avatarUrl: metadata.avatar_url ?? null,
    bannerUrl: metadata.banner_url ?? metadata.banner ?? null,
    displayName:
      metadata.global_name ?? discordUsername ?? "Discord user",
    discordAccentColor,
    discordUsername,
    discordUserId: metadata.provider_id ?? null,
  };
}
