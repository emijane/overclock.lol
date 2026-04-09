"use server";

import { redirect } from "next/navigation";

import { getDiscordProfile } from "@/lib/profiles/discord-profile";
import { createClient } from "@/lib/supabase/server";

// Keeps onboarding errors on the onboarding page instead of dropping users
// into a generic failure state.
function onboardingRedirect(
  message: string,
  type: "error" | "success" = "error"
): never {
  const params = new URLSearchParams({ type, message });
  redirect(`/onboarding?${params.toString()}`);
}

// Shared form guard for onboarding fields that must be present.
function requireFormString(value: FormDataEntryValue | null, fieldName: string): string {
  const parsed = value?.toString().trim();

  if (!parsed) {
    onboardingRedirect(`${fieldName} is required.`);
  }

  return parsed;
}

// Usernames are stored as lowercase handles and used in URLs, so we normalize
// them before validation and persistence.
function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

// Creates the app-owned profile row for a newly authenticated Discord user.
// Only username/display_name come from the form; Discord identity fields are
// read from trusted server-side auth metadata.
export async function createProfile(formData: FormData) {
  const username = normalizeUsername(
    requireFormString(formData.get("username"), "Username")
  );
  const displayName = requireFormString(
    formData.get("display_name"),
    "Display name"
  );

  if (!/^[a-z0-9_]+$/.test(username)) {
    onboardingRedirect(
      "Username can only use lowercase letters, numbers, and underscores."
    );
  }

  if (username.length < 3 || username.length > 24) {
    onboardingRedirect("Username must be between 3 and 24 characters.");
  }

  if (displayName.length < 1 || displayName.length > 40) {
    onboardingRedirect("Display name must be between 1 and 40 characters.");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfileError) {
    onboardingRedirect("Unable to verify your profile state right now.");
  }

  if (existingProfile) {
    redirect("/login");
  }

  const discordProfile = getDiscordProfile(user);

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    username,
    display_name: displayName,
    discord_user_id: discordProfile.discordUserId,
    discord_username: discordProfile.discordUsername || null,
    discord_global_name: discordProfile.displayName,
    discord_avatar_url: discordProfile.avatarUrl,
  });

  if (error) {
    if (error.code === "23505") {
      onboardingRedirect("That username is already taken.");
    }

    onboardingRedirect("Unable to create your profile right now.");
  }

  redirect("/login?type=success&message=Profile+created.");
}
