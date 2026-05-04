import { NextResponse, type NextRequest } from "next/server";

import { isLFGFeedRateLimited } from "@/lib/lfg/lfg-feed-rate-limit";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  if (isLFGFeedRateLimited(request)) {
    return new NextResponse("Too many LFG feed requests. Please try again in a minute.", {
      status: 429,
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
