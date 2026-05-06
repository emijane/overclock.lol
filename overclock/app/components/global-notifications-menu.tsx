import {
  expirePlayInvitesRecord,
  getIncomingPendingPlayInvites,
} from "@/lib/matches/play-invites";
import { GlobalNotificationsMenuClient } from "@/app/components/global-notifications-menu-client";

type GlobalNotificationsMenuProps = {
  currentProfileId: string;
};

export async function GlobalNotificationsMenu({
  currentProfileId,
}: GlobalNotificationsMenuProps) {
  await expirePlayInvitesRecord();

  const { invites, totalCount } = await getIncomingPendingPlayInvites({
    currentProfileId,
  });

  return (
    <GlobalNotificationsMenuClient
      initialInvites={invites}
      initialTotalCount={totalCount}
    />
  );
}
