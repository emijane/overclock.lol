import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { OWNER_PROFILE_SELECT } from "@/lib/profiles/profile-selects";

const loadCurrentProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null, profile: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(OWNER_PROFILE_SELECT)
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  return { user, profile };
});

// Looks up the authenticated Supabase user and their matching app profile.
// This stays read-only so layouts, pages, and server actions can share one
// request-scoped identity lookup without hidden writes.
export async function getCurrentProfile() {
  return loadCurrentProfile();
}
