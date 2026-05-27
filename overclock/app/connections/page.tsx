import { AccountWorkspaceShell } from "@/components/app-shell/account-workspace-shell";
import { PageReveal } from "@/components/app-shell/page-reveal";
import { AccountConnectionsPageView } from "@/features/matches/components/account-connections-page-view";
import { loadMatchesRouteDto } from "@/features/matches/load-matches-route-dto";

export default async function ConnectionsPage() {
  const dto = await loadMatchesRouteDto();

  return (
    <AccountWorkspaceShell>
      <PageReveal variant="fade">
        <AccountConnectionsPageView dto={dto} />
      </PageReveal>
    </AccountWorkspaceShell>
  );
}
