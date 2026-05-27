import { redirect } from "next/navigation";

import { matchesPerfLog, stacksPerfStart } from "@/lib/dev/perf-log";
import { getMatchesPageDto } from "@/lib/pages/matches-page-dto";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

export async function loadMatchesRouteDto() {
  const tRoute = stacksPerfStart();
  const tAuth = stacksPerfStart();
  const { user, profile } = await getCurrentProfile();
  matchesPerfLog("loadMatchesRouteDto auth+profile", tAuth, profile ? 1 : 0);

  if (!user) {
    matchesPerfLog("loadMatchesRouteDto total", tRoute, 0);
    redirect("/login");
  }

  if (!profile) {
    matchesPerfLog("loadMatchesRouteDto total", tRoute, 0);
    redirect("/onboarding");
  }

  const tDto = stacksPerfStart();
  const dto = await getMatchesPageDto(profile.id);
  matchesPerfLog(
    "loadMatchesRouteDto dto",
    tDto,
    dto.connections.length + dto.incomingInvites.length + dto.outgoingInvites.length
  );
  matchesPerfLog("loadMatchesRouteDto total", tRoute, 1);

  return dto;
}
