import { MatchesPageView } from "@/features/matches/components/matches-page-view";
import { loadMatchesRouteDto } from "@/features/matches/load-matches-route-dto";

export async function renderMatchesRoute() {
  const dto = await loadMatchesRouteDto();
  return <MatchesPageView dto={dto} />;
}
