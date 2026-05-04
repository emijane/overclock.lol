"use client";

import { usePresence } from "@/app/components/presence-provider";
import { resolveProfilePresence } from "@/lib/profiles/profile-presence";

type ProfilePresenceIndicatorProps = {
  isLookingToPlay?: boolean | null;
  lastSeenAt?: Date | string | null;
  userId: string;
};

function getDotClassName(status: ReturnType<typeof resolveProfilePresence>["status"]) {
  if (status === "online") {
    return "bg-emerald-400";
  }

  if (status === "recently_active") {
    return "bg-amber-400";
  }

  return "bg-zinc-500";
}

export function ProfilePresenceIndicator({
  isLookingToPlay,
  lastSeenAt,
  userId,
}: ProfilePresenceIndicatorProps) {
  const { isUserOnline } = usePresence();
  const presence = resolveProfilePresence({
    isLookingToPlay,
    isOnline: isUserOnline(userId),
    lastSeenAt,
  });

  return (
    <span
      className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#05070b] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] sm:bottom-1.5 sm:right-1.5 sm:h-7 sm:w-7"
      aria-label={presence.label}
      title={presence.label}
    >
      <span
        aria-hidden="true"
        className={`h-3.5 w-3.5 rounded-full ${getDotClassName(presence.status)} sm:h-4 sm:w-4`}
      />
      <span className="sr-only">{presence.label}</span>
    </span>
  );
}
