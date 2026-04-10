export const REGION_OPTIONS = [
  "NA",
  "EU",
  "APAC",
  "LATAM",
  "MENA",
  "OCE",
] as const;

export const PLATFORM_OPTIONS = ["PC", "Console"] as const;

export const RANK_TIERS = [
  "Unranked",
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Master",
  "Grandmaster",
  "Champion",
] as const;

export const LOOKING_FOR_OPTIONS = [
  "Duo",
  "Team",
  "Scrims",
  "Casual",
  "Competitive",
] as const;

export const REGION_TO_TIMEZONES = {
  NA: [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix",
    "America/Toronto",
    "America/Vancouver",
  ],
  EU: [
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Madrid",
    "Europe/Warsaw",
    "Europe/Helsinki",
  ],
  APAC: ["Asia/Tokyo", "Asia/Seoul", "Asia/Singapore"],
  LATAM: ["America/Sao_Paulo"],
  MENA: ["Europe/Istanbul"],
  OCE: ["Australia/Sydney"],
} as const satisfies Record<(typeof REGION_OPTIONS)[number], readonly string[]>;

export const TIMEZONE_OPTIONS = Object.values(REGION_TO_TIMEZONES).flat();
