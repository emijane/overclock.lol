export const RECENTLY_ACTIVE_WINDOW_MS = 15 * 60 * 1000;

export type ProfilePresenceStatus = "online" | "recently_active" | "offline";

export type ResolvedProfilePresence = {
  isLookingToPlay: boolean;
  label: "Online" | "Recently active" | "Offline";
  status: ProfilePresenceStatus;
};

type ResolveProfilePresenceInput = {
  isLookingToPlay?: boolean | null;
  isOnline: boolean;
  lastSeenAt?: Date | string | null;
  now?: Date;
};

function normalizeLastSeenAt(lastSeenAt: ResolveProfilePresenceInput["lastSeenAt"]) {
  if (!lastSeenAt) {
    return null;
  }

  if (lastSeenAt instanceof Date) {
    return Number.isNaN(lastSeenAt.getTime()) ? null : lastSeenAt;
  }

  const parsed = new Date(lastSeenAt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function resolveProfilePresence({
  isLookingToPlay = false,
  isOnline,
  lastSeenAt,
  now = new Date(),
}: ResolveProfilePresenceInput): ResolvedProfilePresence {
  if (isOnline) {
    return {
      isLookingToPlay: Boolean(isLookingToPlay),
      label: "Online",
      status: "online",
    };
  }

  const normalizedLastSeenAt = normalizeLastSeenAt(lastSeenAt);
  const isRecentlyActive =
    normalizedLastSeenAt !== null &&
    now.getTime() - normalizedLastSeenAt.getTime() <= RECENTLY_ACTIVE_WINDOW_MS;

  if (isRecentlyActive) {
    return {
      isLookingToPlay: Boolean(isLookingToPlay),
      label: "Recently active",
      status: "recently_active",
    };
  }

  return {
    isLookingToPlay: Boolean(isLookingToPlay),
    label: "Offline",
    status: "offline",
  };
}
