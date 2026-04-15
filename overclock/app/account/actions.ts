"use server";

import { redirect } from "next/navigation";

import { sanitizeProfileBio, validateProfileBio } from "@/lib/profiles/profile-bio";
import {
  LOOKING_FOR_OPTIONS,
  PLATFORM_OPTIONS,
  REGION_OPTIONS,
  REGION_TO_TIMEZONES,
  RANK_TIERS,
  TIMEZONE_OPTIONS,
} from "@/lib/profiles/profile-options";
import {
  sanitizeBattlenetHandle,
  sanitizeSocialUrl,
  validateBattlenetHandle,
  validateSocialUrl,
} from "@/lib/profiles/profile-socials";
import { createClient } from "@/lib/supabase/server";

type ParsedProfileUpdate = {
  battlenetHandle: string | null;
  bio: string | null;
  currentRankDivision: number | null;
  currentRankTier: (typeof RANK_TIERS)[number] | null;
  displayName: string | null;
  lookingFor: (typeof LOOKING_FOR_OPTIONS)[number][];
  platform: (typeof PLATFORM_OPTIONS)[number] | null;
  region: (typeof REGION_OPTIONS)[number] | null;
  returnTo: string;
  timezone: (typeof TIMEZONE_OPTIONS)[number] | null;
  twitchUrl: string | null;
  xUrl: string | null;
  youtubeUrl: string | null;
};

function accountRedirect(
  message: string,
  returnTo = "/account",
  type: "error" | "success" = "error"
): never {
  const params = new URLSearchParams({ type, message });
  redirect(`${returnTo}?${params.toString()}`);
}

function optionalTrimmedString(value: FormDataEntryValue | null) {
  const parsed = value?.toString().trim() ?? "";
  return parsed.length > 0 ? parsed : null;
}

function resolveReturnTo(formData: FormData) {
  const parsed = optionalTrimmedString(formData.get("return_to"));

  if (!parsed) {
    return "/account";
  }

  if (!parsed.startsWith("/") || parsed.startsWith("//")) {
    return "/account";
  }

  return parsed;
}

function optionalEnumValue<T extends readonly string[]>(
  value: FormDataEntryValue | null,
  options: T,
  fieldName: string,
  returnTo?: string
): T[number] | null {
  const parsed = optionalTrimmedString(value);

  if (!parsed) {
    return null;
  }

  if (!options.includes(parsed as T[number])) {
    accountRedirect(`Invalid ${fieldName}.`, returnTo);
  }

  return parsed as T[number];
}

function parseRankDivision(
  value: FormDataEntryValue | null,
  fieldName: string,
  returnTo?: string
): number | null {
  const parsed = optionalTrimmedString(value);

  if (!parsed) {
    return null;
  }

  const division = Number(parsed);

  if (!Number.isInteger(division) || division < 1 || division > 5) {
    accountRedirect(`Invalid ${fieldName}.`, returnTo);
  }

  return division;
}

function validateRankPair(
  tier: (typeof RANK_TIERS)[number] | null,
  division: number | null,
  label: string,
  returnTo?: string
) {
  if (!tier && division === null) {
    return;
  }

  if (!tier && division !== null) {
    accountRedirect(`${label} tier is required when a division is set.`, returnTo);
  }

  if (tier === "Unranked" && division !== null) {
    accountRedirect(
      `${label} division must be empty when rank is Unranked.`,
      returnTo
    );
  }

  if (tier && tier !== "Unranked" && division === null) {
    accountRedirect(`${label} division is required.`, returnTo);
  }
}

function parseProfileUpdate(formData: FormData): ParsedProfileUpdate {
  const returnTo = resolveReturnTo(formData);
  const displayName = optionalTrimmedString(formData.get("display_name"));
  const bio = sanitizeProfileBio(formData.get("bio"));
  const battlenetHandle = sanitizeBattlenetHandle(formData.get("battlenet_handle"));
  const twitchUrl = sanitizeSocialUrl(formData.get("twitch_url"));
  const xUrl = sanitizeSocialUrl(formData.get("x_url"));
  const youtubeUrl = sanitizeSocialUrl(formData.get("youtube_url"));
  const timezone = optionalEnumValue(
    formData.get("timezone"),
    TIMEZONE_OPTIONS,
    "server",
    returnTo
  );
  const region = optionalEnumValue(
    formData.get("region"),
    REGION_OPTIONS,
    "region",
    returnTo
  );
  const platform = optionalEnumValue(
    formData.get("platform"),
    PLATFORM_OPTIONS,
    "platform",
    returnTo
  );
  const currentRankTier = optionalEnumValue(
    formData.get("current_rank_tier"),
    RANK_TIERS,
    "current rank tier",
    returnTo
  );
  const currentRankDivision = parseRankDivision(
    formData.get("current_rank_division"),
    "current rank division",
    returnTo
  );
  const lookingFor = formData
    .getAll("looking_for")
    .map((value) => value.toString())
    .filter((value): value is (typeof LOOKING_FOR_OPTIONS)[number] =>
      LOOKING_FOR_OPTIONS.includes(value as (typeof LOOKING_FOR_OPTIONS)[number])
    );

  return {
    battlenetHandle,
    bio,
    currentRankDivision,
    currentRankTier,
    displayName,
    lookingFor,
    platform,
    region,
    returnTo,
    timezone,
    twitchUrl,
    xUrl,
    youtubeUrl,
  };
}

function validateProfileUpdate({
  battlenetHandle,
  bio,
  currentRankDivision,
  currentRankTier,
  displayName,
  region,
  returnTo,
  timezone,
  twitchUrl,
  xUrl,
  youtubeUrl,
}: ParsedProfileUpdate) {
  const bioValidationError = validateProfileBio(bio);
  const battlenetValidationError = validateBattlenetHandle(battlenetHandle);
  const twitchValidationError = validateSocialUrl("twitch_url", twitchUrl);
  const xValidationError = validateSocialUrl("x_url", xUrl);
  const youtubeValidationError = validateSocialUrl("youtube_url", youtubeUrl);

  if (!displayName) {
    accountRedirect("Display name is required.", returnTo);
  }

  if (displayName.length > 40) {
    accountRedirect("Display name must be 40 characters or less.", returnTo);
  }

  if (bioValidationError) {
    accountRedirect(bioValidationError, returnTo);
  }

  if (battlenetValidationError) {
    accountRedirect(battlenetValidationError, returnTo);
  }

  if (twitchValidationError) {
    accountRedirect(twitchValidationError, returnTo);
  }

  if (xValidationError) {
    accountRedirect(xValidationError, returnTo);
  }

  if (youtubeValidationError) {
    accountRedirect(youtubeValidationError, returnTo);
  }

  if (timezone && !region) {
    accountRedirect("Choose a region before selecting a server.", returnTo);
  }

  if (region && timezone) {
    const allowedTimezones = REGION_TO_TIMEZONES[region];

    if (!allowedTimezones.some((value) => value === timezone)) {
      accountRedirect("Selected server does not match the chosen region.", returnTo);
    }
  }

  validateRankPair(currentRankTier, currentRankDivision, "Current rank", returnTo);
}

export async function updateProfile(formData: FormData) {
  const parsedUpdate = parseProfileUpdate(formData);
  validateProfileUpdate(parsedUpdate);

  const {
    battlenetHandle,
    bio,
    currentRankDivision,
    currentRankTier,
    displayName,
    lookingFor,
    platform,
    region,
    returnTo,
    timezone,
    twitchUrl,
    xUrl,
    youtubeUrl,
  } = parsedUpdate;

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      battlenet_handle: battlenetHandle,
      bio,
      current_rank_division: currentRankDivision,
      current_rank_tier: currentRankTier,
      display_name: displayName,
      looking_for: lookingFor,
      platform,
      region,
      timezone,
      twitch_url: twitchUrl,
      x_url: xUrl,
      youtube_url: youtubeUrl,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Profile update failed", {
      error,
      profileId: user.id,
      returnTo,
    });
    accountRedirect("Unable to save your profile settings right now.", returnTo);
  }

  accountRedirect("Profile settings saved.", returnTo, "success");
}
