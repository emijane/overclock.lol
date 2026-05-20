"use server";

import { redirect } from "next/navigation";

import { updateLastSeen as updateSharedLastSeen } from "@/lib/presence/update-last-seen";
import { sanitizeProfileBio } from "@/lib/profiles/profile-bio";
import {
  LOOKING_FOR_OPTIONS,
  REGION_OPTIONS,
  TIMEZONE_OPTIONS,
} from "@/lib/profiles/profile-options";

import {
  accountRedirect,
  optionalTrimmedString,
  requireAuthenticatedProfileContext,
  resolveReturnTo,
} from "./shared";
import {
  parseProfileSocials,
  validateProfileSocials,
} from "./profile-socials";
import {
  getProfileUpdateValidationError,
  type ParsedProfileUpdate,
} from "./profile-validation";

function optionalEnumValue<T extends readonly string[]>(
  value: FormDataEntryValue | null,
  options: T,
  fieldName: string,
  returnTo: string
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

function parseProfileUpdate(formData: FormData): ParsedProfileUpdate {
  const returnTo = resolveReturnTo(formData);
  const socials = parseProfileSocials(formData);

  return {
    ...socials,
    bio: sanitizeProfileBio(formData.get("bio")),
    displayName: optionalTrimmedString(formData.get("display_name")),
    lookingFor: formData
      .getAll("looking_for")
      .map((value) => value.toString())
      .filter((value): value is (typeof LOOKING_FOR_OPTIONS)[number] =>
        LOOKING_FOR_OPTIONS.includes(value as (typeof LOOKING_FOR_OPTIONS)[number])
      ),
    region: optionalEnumValue(
      formData.get("region"),
      REGION_OPTIONS,
      "region",
      returnTo
    ),
    returnTo,
    timezone: optionalEnumValue(
      formData.get("timezone"),
      TIMEZONE_OPTIONS,
      "server",
      returnTo
    ),
  };
}

function validateProfileUpdate(parsedUpdate: ParsedProfileUpdate) {
  const validationError = getProfileUpdateValidationError(parsedUpdate);
  const { returnTo } = parsedUpdate;

  if (validationError) {
    accountRedirect(validationError, returnTo);
  }

  validateProfileSocials(parsedUpdate, returnTo);
}

export async function updateLastSeen() {
  return updateSharedLastSeen();
}

export async function updateProfile(formData: FormData) {
  const parsedUpdate = parseProfileUpdate(formData);
  validateProfileUpdate(parsedUpdate);

  const {
    battlenetHandle,
    bio,
    displayName,
    lookingFor,
    region,
    returnTo,
    timezone,
    twitchUrl,
    xUrl,
    youtubeUrl,
  } = parsedUpdate;

  const context = await requireAuthenticatedProfileContext();

  const { error } = await context.supabase
    .from("profiles")
    .update({
      battlenet_handle: battlenetHandle,
      bio,
      display_name: displayName,
      looking_for: lookingFor,
      region,
      timezone,
      twitch_url: twitchUrl,
      x_url: xUrl,
      youtube_url: youtubeUrl,
    })
    .eq("id", context.userId);

  if (error) {
    console.error("Profile update failed", {
      error,
      profileId: context.userId,
      returnTo,
    });
    accountRedirect("Unable to save your profile settings right now.", returnTo);
  }

  redirect(`${returnTo}?${new URLSearchParams({ type: "success", message: "Profile settings saved." }).toString()}`);
}
