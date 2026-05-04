"use client";

import { LookingToPlayBadge } from "@/app/components/looking-to-play-badge";

type ProfilePresenceBadgesProps = {
  badgeClassName?: string;
  isLookingToPlay?: boolean | null;
};

export function ProfilePresenceBadges({
  badgeClassName,
  isLookingToPlay,
}: ProfilePresenceBadgesProps) {
  if (!isLookingToPlay) {
    return null;
  }

  return <LookingToPlayBadge className={badgeClassName} tone="neutral" />;
}
