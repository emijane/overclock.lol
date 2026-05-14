import { NextResponse } from "next/server";

import { syncDiscordProfileFields } from "@/lib/profiles/sync-discord-profile-fields";
import { OWNER_PROFILE_SELECT } from "@/lib/profiles/profile-selects";
import { createClient } from "@/lib/supabase/server";

// Completes the OAuth round-trip after Supabase sends the user back from
// Discord. We exchange the auth code for a session, then return the user to
// the app.
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/login";
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?type=error&message=Discord+login+failed.+Please+use+a+Discord+account+with+a+verified+email.`
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?type=error&message=Unable+to+sign+in+with+Discord.+Please+use+a+Discord+account+with+a+verified+email.`
    );
  }

  if (user) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(OWNER_PROFILE_SELECT)
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (profile) {
        await syncDiscordProfileFields(user, profile);
      }
    } catch (syncError) {
      console.error("Discord profile sync after auth callback failed", {
        syncError,
        userId: user.id,
      });
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
