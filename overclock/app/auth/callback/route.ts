import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/login";
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?type=error&message=Missing+Discord+auth+code.`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?type=error&message=Unable+to+sign+in+with+Discord.`
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
