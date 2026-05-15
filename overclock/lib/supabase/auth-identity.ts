import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";

export function isSupabaseAuthCookie(cookieName: string) {
  return cookieName.startsWith("sb-") && cookieName.includes("auth-token");
}

export async function getOptionalAuthSubject() {
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
