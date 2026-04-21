import { cookies } from "next/headers";

import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

function isSupabaseAuthCookie(cookieName: string) {
  return cookieName.startsWith("sb-") && cookieName.includes("auth-token");
}

// Public routes only need owner context when a visitor has an auth session.
// Anonymous profile views can skip the Supabase user/profile lookup entirely.
export async function getOptionalCurrentProfile() {
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore.getAll().some((cookie) =>
    isSupabaseAuthCookie(cookie.name)
  );

  if (!hasAuthCookie) {
    return null;
  }

  const { profile } = await getCurrentProfile();
  return profile;
}
