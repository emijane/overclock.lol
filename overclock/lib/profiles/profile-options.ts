export const REGION_OPTIONS = [
  "Americas",
  "Europe",
  "Asia",
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
  Americas: [
    "US Central/East",
    "US West",
    "South America",
    "Oceania",
    "Southeast Asia",
  ],
  Europe: [
    "Amsterdam",
    "Paris",
  ],
  Asia: [
    "Seoul",
    "Taipei",
    "Hong Kong / Macau",
  ],
} as const satisfies Record<(typeof REGION_OPTIONS)[number], readonly string[]>;

export const TIMEZONE_OPTIONS = Object.values(REGION_TO_TIMEZONES).flat();
