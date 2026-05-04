import { resolveProfilePresence, type ResolvedProfilePresence } from "@/lib/profiles/profile-presence";

import { ProfileBadge } from "./profile-badge";

type ProfilePresenceBadgesProps = {
  isLookingToPlay?: boolean | null;
  isOnline?: boolean;
  lastSeenAt?: Date | string | null;
};

function getPresenceTone(status: ResolvedProfilePresence["status"]) {
  if (status === "online") {
    return "bg-emerald-500/10 text-emerald-200 border-emerald-400/20";
  }

  if (status === "recently_active") {
    return "bg-amber-500/10 text-amber-100 border-amber-400/20";
  }

  return "bg-white/5 text-zinc-300 border-white/10";
}

export function ProfilePresenceBadges({
  isLookingToPlay,
  isOnline = false,
  lastSeenAt,
}: ProfilePresenceBadgesProps) {
  const presence = resolveProfilePresence({
    isLookingToPlay,
    isOnline,
    lastSeenAt,
  });

  return (
    <>
      <ProfileBadge className={getPresenceTone(presence.status)}>
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 rounded-full ${
            presence.status === "online"
              ? "bg-emerald-300"
              : presence.status === "recently_active"
                ? "bg-amber-300"
                : "bg-zinc-500"
          }`}
        />
        {presence.label}
      </ProfileBadge>
      {presence.isLookingToPlay ? (
        <ProfileBadge className="border-sky-400/20 bg-sky-400/10 text-sky-100">
          Looking to play
        </ProfileBadge>
      ) : null}
    </>
  );
}
