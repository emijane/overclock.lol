"use server";

import { redirect } from "next/navigation";

import {
  LOOKING_FOR_OPTIONS,
  PLATFORM_OPTIONS,
  REGION_TO_TIMEZONES,
  RANK_TIERS,
  REGION_OPTIONS,
  TIMEZONE_OPTIONS,
} from "@/lib/profiles/profile-options";
import { sanitizeProfileBio, validateProfileBio } from "@/lib/profiles/profile-bio";
import {
  sanitizeBattlenetHandle,
  sanitizeSocialUrl,
  validateBattlenetHandle,
  validateSocialUrl,
} from "@/lib/profiles/profile-socials";
import { createClient } from "@/lib/supabase/server";

function accountRedirect(
  message: string,
  type: "error" | "success" = "error"
): never {
  const params = new URLSearchParams({ type, message });
  redirect(`/account?${params.toString()}`);
}

function optionalTrimmedString(value: FormDataEntryValue | null) {
  const parsed = value?.toString().trim() ?? "";
  return parsed.length > 0 ? parsed : null;
}

function optionalEnumValue<T extends readonly string[]>(
  value: FormDataEntryValue | null,
  options: T,
  fieldName: string
): T[number] | null {
  const parsed = optionalTrimmedString(value);

  if (!parsed) {
    return null;
  }

  if (!options.includes(parsed as T[number])) {
    accountRedirect(`Invalid ${fieldName}.`);
  }

  return parsed as T[number];
}

function parseRankDivision(
  value: FormDataEntryValue | null,
  fieldName: string
): number | null {
  const parsed = optionalTrimmedString(value);

  if (!parsed) {
    return null;
  }

  const division = Number(parsed);

  if (!Number.isInteger(division) || division < 1 || division > 5) {
    accountRedirect(`Invalid ${fieldName}.`);
  }

  return division;
}

function validateRankPair(
  tier: (typeof RANK_TIERS)[number] | null,
  division: number | null,
  label: string
) {
  if (!tier && division === null) {
    return;
  }

  if (!tier && division !== null) {
    accountRedirect(`${label} tier is required when a division is set.`);
  }

  if (tier === "Unranked" && division !== null) {
    accountRedirect(`${label} division must be empty when rank is Unranked.`);
  }

  if (tier && tier !== "Unranked" && division === null) {
    accountRedirect(`${label} division is required.`);
  }
}

export async function updateProfile(formData: FormData) {
  const bio = sanitizeProfileBio(formData.get("bio"));
  const battlenetHandle = sanitizeBattlenetHandle(formData.get("battlenet_handle"));
  const twitchUrl = sanitizeSocialUrl(formData.get("twitch_url"));
  const xUrl = sanitizeSocialUrl(formData.get("x_url"));
  const youtubeUrl = sanitizeSocialUrl(formData.get("youtube_url"));
  const timezone = optionalEnumValue(
    formData.get("timezone"),
    TIMEZONE_OPTIONS,
    "timezone"
  );
  const region = optionalEnumValue(formData.get("region"), REGION_OPTIONS, "region");
  const platform = optionalEnumValue(
    formData.get("platform"),
    PLATFORM_OPTIONS,
    "platform"
  );
  const currentRankTier = optionalEnumValue(
    formData.get("current_rank_tier"),
    RANK_TIERS,
    "current rank tier"
  );
  const currentRankDivision = parseRankDivision(
    formData.get("current_rank_division"),
    "current rank division"
  );
  const lookingFor = formData
    .getAll("looking_for")
    .map((value) => value.toString())
    .filter((value): value is (typeof LOOKING_FOR_OPTIONS)[number] =>
      LOOKING_FOR_OPTIONS.includes(value as (typeof LOOKING_FOR_OPTIONS)[number])
    );

  const bioValidationError = validateProfileBio(bio);
  const battlenetValidationError = validateBattlenetHandle(battlenetHandle);
  const twitchValidationError = validateSocialUrl("twitch_url", twitchUrl);
  const xValidationError = validateSocialUrl("x_url", xUrl);
  const youtubeValidationError = validateSocialUrl("youtube_url", youtubeUrl);

  if (bioValidationError) {
    accountRedirect(bioValidationError);
  }

  if (battlenetValidationError) {
    accountRedirect(battlenetValidationError);
  }

  if (twitchValidationError) {
    accountRedirect(twitchValidationError);
  }

  if (xValidationError) {
    accountRedirect(xValidationError);
  }

  if (youtubeValidationError) {
    accountRedirect(youtubeValidationError);
  }

  if (timezone && !region) {
    accountRedirect("Choose a region before selecting a timezone.");
  }

  if (region && timezone) {
    const allowedTimezones = REGION_TO_TIMEZONES[region];

    if (!allowedTimezones.some((value) => value === timezone)) {
      accountRedirect("Selected timezone does not match the chosen region.");
    }
  }

  validateRankPair(currentRankTier, currentRankDivision, "Current rank");

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
      timezone,
      region,
      platform,
      current_rank_tier: currentRankTier,
      current_rank_division: currentRankDivision,
      looking_for: lookingFor,
      twitch_url: twitchUrl,
      x_url: xUrl,
      youtube_url: youtubeUrl,
    })
    .eq("id", user.id);

  if (error) {
    accountRedirect("Unable to save your profile settings right now.");
  }

  accountRedirect("Profile settings saved.", "success");
}
