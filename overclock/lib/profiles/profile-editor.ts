import { REGION_TO_TIMEZONES } from "@/lib/profiles/profile-options";

export const RANK_DIVISION_OPTIONS = ["1", "2", "3", "4", "5"] as const;

export const SOCIAL_URL_PREFIXES = {
  twitch: [
    "https://twitch.tv/",
    "http://twitch.tv/",
    "https://www.twitch.tv/",
    "http://www.twitch.tv/",
    "twitch.tv/",
    "www.twitch.tv/",
  ],
  x: [
    "https://x.com/",
    "http://x.com/",
    "https://www.x.com/",
    "http://www.x.com/",
    "https://twitter.com/",
    "http://twitter.com/",
    "https://www.twitter.com/",
    "http://www.twitter.com/",
    "x.com/",
    "twitter.com/",
    "www.x.com/",
    "www.twitter.com/",
  ],
  youtube: [
    "https://youtube.com/@",
    "http://youtube.com/@",
    "https://www.youtube.com/@",
    "http://www.youtube.com/@",
    "youtube.com/@",
    "www.youtube.com/@",
  ],
} as const;

export function formatCurrentRank(
  tier: string | null | undefined,
  division: number | string | null | undefined
) {
  if (!tier) {
    return "Not set";
  }

  if (tier === "Unranked") {
    return "Unranked";
  }

  return `${tier} ${division ?? ""}`.trim();
}

export function getServerOptions(region: string) {
  if (!region) {
    return [] as string[];
  }

  return [
    ...(REGION_TO_TIMEZONES[region as keyof typeof REGION_TO_TIMEZONES] ?? []),
  ];
}

export function resetServerIfInvalid(region: string, currentServer: string) {
  const nextServerOptions = getServerOptions(region);

  if (!region || !nextServerOptions.includes(currentServer)) {
    return "";
  }

  return currentServer;
}

export function stripSocialPrefix(value: string, prefixes: readonly string[]) {
  const normalizedValue = value.trim();

  for (const prefix of prefixes) {
    if (normalizedValue.toLowerCase().startsWith(prefix.toLowerCase())) {
      return normalizedValue.slice(prefix.length);
    }
  }

  return normalizedValue;
}

export function normalizeSocialHandle(value: string) {
  return value.trim().replace(/^@+/, "");
}

export function buildSocialUrl(prefix: string, value: string) {
  const normalizedValue = normalizeSocialHandle(value);
  return normalizedValue ? `${prefix}${normalizedValue}` : "";
}
