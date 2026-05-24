import { NextResponse } from "next/server";

import { notificationsPerfLog, stacksPerfStart } from "@/lib/dev/perf-log";
import { getNotificationsMenuDto } from "@/lib/pages/matches-page-dto";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

export async function GET() {
  const tRequest = stacksPerfStart();
  try {
    const tAuth = stacksPerfStart();
    const { user } = await getCurrentProfile();
    notificationsPerfLog("GET /api/notifications/menu auth+profile", tAuth, user ? 1 : 0);

    if (!user) {
      notificationsPerfLog("GET /api/notifications/menu total", tRequest, 0);
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const tDto = stacksPerfStart();
    const dto = await getNotificationsMenuDto(user.id);
    notificationsPerfLog("GET /api/notifications/menu dto", tDto, dto.totalCount);
    notificationsPerfLog("GET /api/notifications/menu total", tRequest, dto.totalCount);

    return NextResponse.json(dto);
  } catch {
    notificationsPerfLog("GET /api/notifications/menu total", tRequest, 0);
    return NextResponse.json(
      { error: "Unable to load notifications right now." },
      { status: 500 }
    );
  }
}
