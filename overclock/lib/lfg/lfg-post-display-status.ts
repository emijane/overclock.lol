import type { LFGPostStatus } from "./lfg-post-types";

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

export function isLFGPostExpired(
  expiresAt: string | null | undefined,
  now = new Date()
) {
  if (!expiresAt) {
    return false;
  }
  const expiresAtMs = new Date(expiresAt).getTime();
  return !Number.isNaN(expiresAtMs) && expiresAtMs <= now.getTime();
}

export function getLFGPostDisplayStatus(input: {
  expiresAt?: string | null;
  status: LFGPostStatus;
}): LFGPostDisplayStatus {
  if (input.status === "closed" || input.status === "archived") {
    return "closed";
  }

  if (input.status === "expired") {
    return "expired";
  }

  if (isLFGPostExpired(input.expiresAt)) {
    return "expired";
  }

  return "active";
}
