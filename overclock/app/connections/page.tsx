import { redirect } from "next/navigation";

import { MatchesPageView } from "@/features/matches/components/matches-page-view";
import { getMatchesPageDto } from "@/lib/pages/matches-page-dto";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

export default async function ConnectionsPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/onboarding");
  }

  const dto = await getMatchesPageDto(profile.id);

  return <MatchesPageView currentProfileId={profile.id} dto={dto} />;
}
