import { createClient } from "@/lib/supabase/server";
import { PUBLIC_PROFILE_SELECT } from "@/lib/profiles/profile-selects";

// Loads a public profile by its unique app-owned username/handle.
export async function getProfileByUsername(username: string) {
  const normalizedUsername = username.trim().toLowerCase();
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(PUBLIC_PROFILE_SELECT)
    .eq("username", normalizedUsername)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return profile;
}
