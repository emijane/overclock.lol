import { NextResponse } from "next/server";

import { getNotificationsMenuDto } from "@/lib/pages/matches-page-dto";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

export async function GET() {
  try {
    const { user } = await getCurrentProfile();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const dto = await getNotificationsMenuDto(user.id);

    return NextResponse.json(dto);
  } catch {
    return NextResponse.json(
      { error: "Unable to load notifications right now." },
      { status: 500 }
    );
  }
}
