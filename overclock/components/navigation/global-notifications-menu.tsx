import { getNotificationsMenuDto } from "@/lib/pages/matches-page-dto";
import { GlobalNotificationsMenuClient } from "@/components/navigation/global-notifications-menu-client";

type GlobalNotificationsMenuProps = {
  currentProfileId: string;
};

export async function GlobalNotificationsMenu({
  currentProfileId,
}: GlobalNotificationsMenuProps) {
  const dto = await getNotificationsMenuDto(currentProfileId);

  return (
    <GlobalNotificationsMenuClient
      currentProfileId={currentProfileId}
      initialInvites={dto.incomingInvites}
      initialStackRequests={dto.stackRequests}
      initialTotalCount={dto.totalCount}
    />
  );
}
