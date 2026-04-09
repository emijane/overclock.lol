import { createClient } from "@/lib/supabase/server";

// Loads a public profile by its unique app-owned username/handle.
export async function getProfileByUsername(username: string) {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, display_name, discord_username, discord_avatar_url, bio")
    .ilike("username", username)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return profile;
}
