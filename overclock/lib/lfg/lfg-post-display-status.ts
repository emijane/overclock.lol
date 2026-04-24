import type { LFGPostStatus } from "./lfg-post-types";
import { ACTIVE_LFG_POST_WINDOW_HOURS } from "./lfg-post-policy";

export const LFG_POST_DISPLAY_STATUS_OPTIONS = [
  "active",
  "closed",
  "expired",
] as const;
export type LFGPostDisplayStatus = "active" | "closed" | "expired";

export function isLFGPostDisplayStatus(
  value: string
): value is LFGPostDisplayStatus {
  return LFG_POST_DISPLAY_STATUS_OPTIONS.includes(value as LFGPostDisplayStatus);
}

export function isLFGPostExpired(createdAt: string, now = new Date()) {
  if (!createdAt) {
    return false;
  }

  const createdAtDate = new Date(createdAt);

  if (Number.isNaN(createdAtDate.getTime())) {
    return false;
  }

  return (
    now.getTime() - createdAtDate.getTime() >
    ACTIVE_LFG_POST_WINDOW_HOURS * 60 * 60 * 1000
  );
}

export function getLFGPostDisplayStatus(input: {
  createdAt: string;
  status: LFGPostStatus;
}): LFGPostDisplayStatus {
  if (input.status === "closed" || input.status === "archived") {
    return "closed";
  }

  if (isLFGPostExpired(input.createdAt)) {
    return "expired";
  }

  return "active";
}
