import { validateProfileBio } from "@/lib/profiles/profile-bio";
import {
  LOOKING_FOR_OPTIONS,
  REGION_OPTIONS,
  REGION_TO_TIMEZONES,
  TIMEZONE_OPTIONS,
} from "@/lib/profiles/profile-options";

import type { ParsedProfileSocials } from "./profile-socials";

export type ParsedProfileUpdate = ParsedProfileSocials & {
  bio: string | null;
  displayName: string | null;
  lookingFor: (typeof LOOKING_FOR_OPTIONS)[number][];
  region: (typeof REGION_OPTIONS)[number] | null;
  returnTo: string;
  timezone: (typeof TIMEZONE_OPTIONS)[number] | null;
};

export function getProfileUpdateValidationError(
  parsedUpdate: ParsedProfileUpdate
) {
  const { bio, displayName, region, timezone } = parsedUpdate;
  const bioValidationError = validateProfileBio(bio);

  if (!displayName) {
    return "Display name is required.";
  }

  if (displayName.length > 40) {
    return "Display name must be 40 characters or less.";
  }

  if (bioValidationError) {
    return bioValidationError;
  }

  if (timezone && !region) {
    return "Choose a region before selecting a server.";
  }

  if (region && timezone) {
    const allowedTimezones = REGION_TO_TIMEZONES[region];

    if (!allowedTimezones.some((value) => value === timezone)) {
      return "Selected server does not match the chosen region.";
    }
  }

  return null;
}
