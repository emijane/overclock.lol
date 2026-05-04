"use client";

import { ProfileBadge } from "./profile-badge";

type ProfilePresenceBadgesProps = {
  isLookingToPlay?: boolean | null;
};

export function ProfilePresenceBadges({
  isLookingToPlay,
}: ProfilePresenceBadgesProps) {
  if (!isLookingToPlay) {
    return null;
  }

  return (
    <ProfileBadge className="border-sky-400/20 bg-sky-400/10 text-sky-100">
      Looking to play
    </ProfileBadge>
  );
}
