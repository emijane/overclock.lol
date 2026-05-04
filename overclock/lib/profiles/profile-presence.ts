export type ProfilePresenceStatus = "online" | "offline";

export type ResolvedProfilePresence = {
  isLookingToPlay: boolean;
  label: "Online" | "Offline";
  status: ProfilePresenceStatus;
};

type ResolveProfilePresenceInput = {
  isLookingToPlay?: boolean | null;
  isOnline: boolean;
  lastSeenAt?: Date | string | null;
  now?: Date;
};

export function resolveProfilePresence({
  isLookingToPlay = false,
  isOnline,
}: ResolveProfilePresenceInput): ResolvedProfilePresence {
  if (isOnline) {
    return {
      isLookingToPlay: Boolean(isLookingToPlay),
      label: "Online",
      status: "online",
    };
  }

  return {
    isLookingToPlay: Boolean(isLookingToPlay),
    label: "Offline",
    status: "offline",
  };
}
