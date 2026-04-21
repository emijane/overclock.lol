import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";

function isSupabaseAuthCookie(cookieName: string) {
  return cookieName.startsWith("sb-") && cookieName.includes("auth-token");
}

// Public routes only need the viewer id to decide whether owner controls show.
// Anonymous profile views can skip Supabase auth work entirely.
export async function getOptionalCurrentUserId() {
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore.getAll().some((cookie) =>
    isSupabaseAuthCookie(cookie.name)
  );

  if (!hasAuthCookie) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const subject = data?.claims?.sub;

  if (error || typeof subject !== "string") {
    return null;
  }

  return subject;
}
