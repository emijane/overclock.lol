"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { sanitizeProfileBio, validateProfileBio } from "@/lib/profiles/profile-bio";
import {
  LOOKING_FOR_OPTIONS,
  REGION_OPTIONS,
  REGION_TO_TIMEZONES,
  TIMEZONE_OPTIONS,
} from "@/lib/profiles/profile-options";
import {
  sanitizeBattlenetHandle,
  sanitizeSocialUrl,
  validateBattlenetHandle,
  validateSocialUrl,
} from "@/lib/profiles/profile-socials";
import {
  PROFILE_AVATAR_MAX_BYTES,
  PROFILE_COVER_IMAGE_MAX_BYTES,
  PROFILE_MEDIA_BUCKET,
  PROFILE_MEDIA_IMAGE_MIME_TYPES,
  getProfileAvatarPath,
  getProfileCoverPath,
} from "@/lib/profiles/profile-media";
import { createClient } from "@/lib/supabase/server";

const MEDIA_UPLOAD_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MEDIA_UPLOAD_RATE_LIMIT_MAX = 2;

type UploadMediaResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

async function checkMediaUploadRateLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
  mediaType: "avatar" | "cover"
): Promise<boolean> {
  const windowStart = new Date(Date.now() - MEDIA_UPLOAD_RATE_LIMIT_WINDOW_MS).toISOString();
  const { count } = await supabase
    .from("profile_media_uploads")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .eq("media_type", mediaType)
    .gte("uploaded_at", windowStart);

  return (count ?? 0) >= MEDIA_UPLOAD_RATE_LIMIT_MAX;
}

async function recordMediaUpload(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
  mediaType: "avatar" | "cover"
) {
  await supabase
    .from("profile_media_uploads")
    .insert({ profile_id: profileId, media_type: mediaType });
}

async function deactivateOldMedia(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
  mediaType: "avatar" | "cover"
) {
  const deleteAfter = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("profile_media")
    .update({
      is_active: false,
      deactivated_at: new Date().toISOString(),
      delete_after: deleteAfter,
    })
    .eq("profile_id", profileId)
    .eq("media_type", mediaType)
    .eq("is_active", true);
}

export async function uploadProfileAvatar(
  formData: FormData
): Promise<UploadMediaResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: ownerProfile, error: profileError } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profileError || !ownerProfile) {
    redirect("/onboarding");
  }

  const isRateLimited = await checkMediaUploadRateLimit(supabase, user.id, "avatar");

  if (isRateLimited) {
    return {
      status: "error",
      message: "Too many uploads. Try again in an hour.",
    };
  }

  const avatarImage = formData.get("avatar_image");

  if (!(avatarImage instanceof File) || avatarImage.size === 0) {
    return { status: "error", message: "Choose an avatar image to upload." };
  }

  if (!PROFILE_MEDIA_IMAGE_MIME_TYPES.some((type) => type === avatarImage.type)) {
    return {
      status: "error",
      message: "Avatar must be a JPG, PNG, or WebP file.",
    };
  }

  if (avatarImage.size > PROFILE_AVATAR_MAX_BYTES) {
    return {
      status: "error",
      message: `Avatar must be ${PROFILE_AVATAR_MAX_BYTES / 1024 / 1024} MB or smaller.`,
    };
  }

  const avatarPath = getProfileAvatarPath(user.id);
  const avatarBuffer = await avatarImage.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(PROFILE_MEDIA_BUCKET)
    .upload(avatarPath, avatarBuffer, {
      cacheControl: "3600",
      contentType: avatarImage.type,
      upsert: true,
    });

  if (uploadError) {
    const msg = uploadError.message.toLowerCase();

    if (
      msg.includes("row-level security") ||
      msg.includes("permission") ||
      msg.includes("not authorized")
    ) {
      return {
        status: "error",
        message:
          "Avatar upload is blocked by storage policy. Add the profile-media upload policies first.",
      };
    }

    return {
      status: "error",
      message: "Unable to upload your avatar right now.",
    };
  }

  await deactivateOldMedia(supabase, user.id, "avatar");

  const avatarUpdatedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      avatar_url: avatarPath,
      avatar_updated_at: avatarUpdatedAt,
    })
    .eq("id", user.id);

  if (updateError) {
    return {
      status: "error",
      message: "Avatar uploaded, but we could not save it to your profile.",
    };
  }

  const { error: mediaInsertError } = await supabase.from("profile_media").upsert(
    {
      profile_id: user.id,
      storage_path: avatarPath,
      media_type: "avatar",
      is_active: true,
    },
    { onConflict: "profile_id,media_type,storage_path" }
  );

  if (mediaInsertError) {
    return {
      status: "error",
      message: "Avatar uploaded but media record failed. Try again.",
    };
  }

  await recordMediaUpload(supabase, user.id, "avatar");

  revalidatePath("/account");
  revalidatePath(`/u/${ownerProfile.username}`);
  return { status: "success", message: "Avatar updated." };
}

export async function uploadProfileCover(
  formData: FormData
): Promise<UploadMediaResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: ownerProfile, error: profileError } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profileError || !ownerProfile) {
    redirect("/onboarding");
  }

  const isRateLimited = await checkMediaUploadRateLimit(supabase, user.id, "cover");

  if (isRateLimited) {
    return {
      status: "error",
      message: "Too many uploads. Try again in an hour.",
    };
  }

  const coverImage = formData.get("cover_image");

  if (!(coverImage instanceof File) || coverImage.size === 0) {
    return { status: "error", message: "Choose a cover image to upload." };
  }

  if (!PROFILE_MEDIA_IMAGE_MIME_TYPES.some((type) => type === coverImage.type)) {
    return {
      status: "error",
      message: "Cover image must be a JPG, PNG, or WebP file.",
    };
  }

  if (coverImage.size > PROFILE_COVER_IMAGE_MAX_BYTES) {
    return {
      status: "error",
      message: `Cover image must be ${PROFILE_COVER_IMAGE_MAX_BYTES / 1024 / 1024} MB or smaller.`,
    };
  }

  const coverImagePath = getProfileCoverPath(user.id);
  const coverImageBuffer = await coverImage.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(PROFILE_MEDIA_BUCKET)
    .upload(coverImagePath, coverImageBuffer, {
      cacheControl: "3600",
      contentType: coverImage.type,
      upsert: true,
    });

  if (uploadError) {
    const msg = uploadError.message.toLowerCase();

    if (
      msg.includes("row-level security") ||
      msg.includes("permission") ||
      msg.includes("not authorized")
    ) {
      return {
        status: "error",
        message:
          "Cover upload is blocked by storage policy. Add the profile-media upload policies first.",
      };
    }

    return {
      status: "error",
      message: "Unable to upload your cover image right now.",
    };
  }

  await deactivateOldMedia(supabase, user.id, "cover");

  const coverImageUpdatedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      cover_image_path: coverImagePath,
      cover_image_updated_at: coverImageUpdatedAt,
    })
    .eq("id", user.id);

  if (updateError) {
    return {
      status: "error",
      message: "Cover image uploaded, but we could not save it to your profile.",
    };
  }

  const { error: mediaInsertError } = await supabase.from("profile_media").upsert(
    {
      profile_id: user.id,
      storage_path: coverImagePath,
      media_type: "cover",
      is_active: true,
    },
    { onConflict: "profile_id,media_type,storage_path" }
  );

  if (mediaInsertError) {
    return {
      status: "error",
      message: "Cover uploaded but media record failed. Try again.",
    };
  }

  await recordMediaUpload(supabase, user.id, "cover");

  revalidatePath("/account");
  revalidatePath(`/u/${ownerProfile.username}`);
  return { status: "success", message: "Cover image updated." };
}

export type UpdateLastSeenResult =
  | { status: "success" }
  | { status: "unauthenticated" }
  | { status: "error"; message: string };

export type SetLookingToPlayResult =
  | { status: "success"; isLookingToPlay: boolean }
  | { status: "unauthenticated" }
  | { status: "error"; message: string };

export type SetHideOfflinePresenceResult =
  | { status: "success"; hideOfflinePresence: boolean }
  | { status: "unauthenticated" }
  | { status: "error"; message: string };

type ParsedProfileUpdate = {
  battlenetHandle: string | null;
  bio: string | null;
  displayName: string | null;
  lookingFor: (typeof LOOKING_FOR_OPTIONS)[number][];
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
  const lookingFor = formData
    .getAll("looking_for")
    .map((value) => value.toString())
    .filter((value): value is (typeof LOOKING_FOR_OPTIONS)[number] =>
      LOOKING_FOR_OPTIONS.includes(value as (typeof LOOKING_FOR_OPTIONS)[number])
    );

  return {
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
  };
}

function validateProfileUpdate({
  battlenetHandle,
  bio,
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
      display_name: displayName,
      looking_for: lookingFor,
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

export async function updateLastSeen(): Promise<UpdateLastSeenResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { status: "unauthenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Last seen update failed", {
      error,
      profileId: user.id,
    });
    return {
      status: "error",
      message: "Unable to update presence activity right now.",
    };
  }

  return { status: "success" };
}

export async function setLookingToPlay(
  isLookingToPlay: boolean
): Promise<SetLookingToPlayResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { status: "unauthenticated" };
  }

  const { data: ownerProfile, error: profileError } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profileError || !ownerProfile) {
    console.error("Looking to play toggle profile lookup failed", {
      error: profileError,
      profileId: user.id,
    });
    return {
      status: "error",
      message: "Unable to update availability right now.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      is_looking_to_play: isLookingToPlay,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Looking to play toggle failed", {
      error,
      isLookingToPlay,
      profileId: user.id,
    });
    return {
      status: "error",
      message: "Unable to update availability right now.",
    };
  }

  revalidatePath("/account");
  revalidatePath(`/u/${ownerProfile.username}`);

  return { status: "success", isLookingToPlay };
}

export async function setHideOfflinePresence(
  hideOfflinePresence: boolean
): Promise<SetHideOfflinePresenceResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { status: "unauthenticated" };
  }

  const { data: ownerProfile, error: profileError } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profileError || !ownerProfile) {
    console.error("Hide offline presence profile lookup failed", {
      error: profileError,
      profileId: user.id,
    });
    return {
      status: "error",
      message: "Unable to update presence privacy right now.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      hide_offline_presence: hideOfflinePresence,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Hide offline presence toggle failed", {
      error,
      hideOfflinePresence,
      profileId: user.id,
    });
    return {
      status: "error",
      message: "Unable to update presence privacy right now.",
    };
  }

  revalidatePath("/account");
  revalidatePath(`/u/${ownerProfile.username}`);

  return { status: "success", hideOfflinePresence };
}
