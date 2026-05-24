import { redirect } from "next/navigation";

import { MatchesPageView } from "@/features/matches/components/matches-page-view";
import { matchesPerfLog, stacksPerfStart } from "@/lib/dev/perf-log";
import { getMatchesPageDto } from "@/lib/pages/matches-page-dto";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

export async function renderMatchesRoute() {
  const tRoute = stacksPerfStart();
  const tAuth = stacksPerfStart();
  const { user, profile } = await getCurrentProfile();
  matchesPerfLog("renderMatchesRoute auth+profile", tAuth, profile ? 1 : 0);

  if (!user) {
    matchesPerfLog("renderMatchesRoute total", tRoute, 0);
    redirect("/login");
  }

  if (!profile) {
    matchesPerfLog("renderMatchesRoute total", tRoute, 0);
    redirect("/onboarding");
  }

  const tDto = stacksPerfStart();
  const dto = await getMatchesPageDto(profile.id);
  matchesPerfLog(
    "renderMatchesRoute dto",
    tDto,
    dto.connections.length + dto.incomingInvites.length + dto.outgoingInvites.length
  );
  matchesPerfLog("renderMatchesRoute total", tRoute, 1);

  return <MatchesPageView dto={dto} />;
}
