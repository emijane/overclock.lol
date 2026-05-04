import { RankedAvatar } from "@/app/components/ranked-avatar";

import { ProfilePresenceIndicator } from "./profile-presence-indicator";

type ProfileAvatarProps = {
  avatarUrl: string | null;
  currentRankTier?: string | null;
  displayName: string;
  isLookingToPlay?: boolean | null;
  lastSeenAt?: Date | string | null;
  userId: string;
};

export function ProfileAvatar({
  avatarUrl,
  currentRankTier,
  displayName,
  isLookingToPlay,
  lastSeenAt,
  userId,
}: ProfileAvatarProps) {
  return (
    <RankedAvatar
      avatarUrl={avatarUrl}
      className="h-28 w-28 sm:h-32 sm:w-32"
      displayName={displayName}
      fallbackClassName="text-3xl font-semibold text-zinc-100 sm:text-[2.2rem]"
      overlay={
        <ProfilePresenceIndicator
          isLookingToPlay={isLookingToPlay}
          lastSeenAt={lastSeenAt}
          userId={userId}
        />
      }
      rankTier={currentRankTier}
      ringClassName="-inset-[3px] opacity-75"
    />
  );
}
