import { getIncomingPendingPlayInvites } from "@/lib/matches/play-invites";
import { getIncomingPendingStackRequests } from "@/lib/lfg/stack-requests";
import { GlobalNotificationsMenuClient } from "@/components/navigation/global-notifications-menu-client";

type GlobalNotificationsMenuProps = {
  currentProfileId: string;
};

export async function GlobalNotificationsMenu({
  currentProfileId,
}: GlobalNotificationsMenuProps) {
  const [{ invites, totalCount }, { requests: stackRequests, totalCount: stackCount }] =
    await Promise.all([
      getIncomingPendingPlayInvites({ currentProfileId }),
      getIncomingPendingStackRequests({ currentProfileId }),
    ]);

  return (
    <GlobalNotificationsMenuClient
      currentProfileId={currentProfileId}
      initialInvites={invites}
      initialStackRequests={stackRequests}
      initialTotalCount={totalCount + stackCount}
    />
  );
}
