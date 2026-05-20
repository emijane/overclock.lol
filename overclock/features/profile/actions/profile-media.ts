"use server";

import {
  PROFILE_AVATAR_MAX_BYTES,
  PROFILE_COVER_IMAGE_MAX_BYTES,
  PROFILE_MEDIA_BUCKET,
  PROFILE_MEDIA_IMAGE_MIME_TYPES,
  getProfileAvatarPath,
  getProfileCoverPath,
} from "@/lib/profiles/profile-media";

import {
  type AuthenticatedProfileContext,
  revalidateAccountProfile,
  requireAuthenticatedProfileContext,
} from "./shared";

const MEDIA_UPLOAD_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MEDIA_UPLOAD_RATE_LIMIT_MAX_BY_TYPE = {
  avatar: 6,
  cover: 2,
} as const;

export type UploadMediaResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

async function checkMediaUploadRateLimit(
  supabase: AuthenticatedProfileContext["supabase"],
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

  return (count ?? 0) >= MEDIA_UPLOAD_RATE_LIMIT_MAX_BY_TYPE[mediaType];
}

async function recordMediaUpload(
  supabase: AuthenticatedProfileContext["supabase"],
  profileId: string,
  mediaType: "avatar" | "cover"
) {
  await supabase
    .from("profile_media_uploads")
    .insert({ profile_id: profileId, media_type: mediaType });
}

async function deactivateOldMedia(
  supabase: AuthenticatedProfileContext["supabase"],
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

function validateMediaFile(
  file: FormDataEntryValue | null,
  _fieldLabel: "avatar" | "cover image",
  maxBytes: number
): file is File {
  if (!(file instanceof File) || file.size === 0) {
    return false;
  }

  if (!PROFILE_MEDIA_IMAGE_MIME_TYPES.some((type) => type === file.type)) {
    return false;
  }

  if (file.size > maxBytes) {
    return false;
  }

  return true;
}

function getInvalidMediaMessage(
  file: FormDataEntryValue | null,
  fieldLabel: "avatar" | "cover image",
  maxBytes: number
) {
  if (!(file instanceof File) || file.size === 0) {
    return `Choose a ${fieldLabel} to upload.`;
  }

  if (!PROFILE_MEDIA_IMAGE_MIME_TYPES.some((type) => type === file.type)) {
    return `${fieldLabel === "avatar" ? "Avatar" : "Cover image"} must be a JPG, PNG, or WebP file.`;
  }

  return `${fieldLabel === "avatar" ? "Avatar" : "Cover image"} must be ${maxBytes / 1024 / 1024} MB or smaller.`;
}

async function uploadProfileMedia(input: {
  file: File;
  mediaType: "avatar" | "cover";
  profileId: string;
  supabase: AuthenticatedProfileContext["supabase"];
  username: string;
}) {
  const path =
    input.mediaType === "avatar"
      ? getProfileAvatarPath(input.profileId)
      : getProfileCoverPath(input.profileId);
  const buffer = await input.file.arrayBuffer();
  const { error: uploadError } = await input.supabase.storage
    .from(PROFILE_MEDIA_BUCKET)
    .upload(path, buffer, {
      cacheControl: "3600",
      contentType: input.file.type,
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
          input.mediaType === "avatar"
            ? "Avatar upload is blocked by storage policy. Add the profile-media upload policies first."
            : "Cover upload is blocked by storage policy. Add the profile-media upload policies first.",
      } satisfies UploadMediaResult;
    }

    return {
      status: "error",
      message:
        input.mediaType === "avatar"
          ? "Unable to upload your avatar right now."
          : "Unable to upload your cover image right now.",
    } satisfies UploadMediaResult;
  }

  await deactivateOldMedia(input.supabase, input.profileId, input.mediaType);

  const updatedAt = new Date().toISOString();
  const { error: updateError } = await input.supabase
    .from("profiles")
    .update(
      input.mediaType === "avatar"
        ? {
            avatar_url: path,
            avatar_updated_at: updatedAt,
          }
        : {
            cover_image_path: path,
            cover_image_updated_at: updatedAt,
          }
    )
    .eq("id", input.profileId);

  if (updateError) {
    return {
      status: "error",
      message:
        input.mediaType === "avatar"
          ? "Avatar uploaded, but we could not save it to your profile."
          : "Cover image uploaded, but we could not save it to your profile.",
    } satisfies UploadMediaResult;
  }

  await input.supabase.from("profile_media").upsert(
    {
      profile_id: input.profileId,
      storage_path: path,
      media_type: input.mediaType,
      is_active: true,
    },
    { onConflict: "profile_id,media_type,storage_path" }
  );

  await recordMediaUpload(input.supabase, input.profileId, input.mediaType);
  revalidateAccountProfile(input.username);

  return {
    status: "success",
    message: input.mediaType === "avatar" ? "Avatar updated." : "Cover image updated.",
  } satisfies UploadMediaResult;
}

export async function uploadProfileAvatar(
  formData: FormData
): Promise<UploadMediaResult> {
  const context = await requireAuthenticatedProfileContext();
  const avatarImage = formData.get("avatar_image");

  if (!validateMediaFile(avatarImage, "avatar", PROFILE_AVATAR_MAX_BYTES)) {
    return {
      status: "error",
      message: getInvalidMediaMessage(
        avatarImage,
        "avatar",
        PROFILE_AVATAR_MAX_BYTES
      ),
    } satisfies UploadMediaResult;
  }

  if (await checkMediaUploadRateLimit(context.supabase, context.userId, "avatar")) {
    return {
      status: "error",
      message: "Too many uploads. Try again in an hour.",
    } satisfies UploadMediaResult;
  }

  return uploadProfileMedia({
    file: avatarImage,
    mediaType: "avatar",
    profileId: context.userId,
    supabase: context.supabase,
    username: context.username,
  });
}

export async function uploadProfileCover(
  formData: FormData
): Promise<UploadMediaResult> {
  const context = await requireAuthenticatedProfileContext();
  const coverImage = formData.get("cover_image");

  if (!validateMediaFile(coverImage, "cover image", PROFILE_COVER_IMAGE_MAX_BYTES)) {
    return {
      status: "error",
      message: getInvalidMediaMessage(
        coverImage,
        "cover image",
        PROFILE_COVER_IMAGE_MAX_BYTES
      ),
    } satisfies UploadMediaResult;
  }

  if (await checkMediaUploadRateLimit(context.supabase, context.userId, "cover")) {
    return {
      status: "error",
      message: "Too many uploads. Try again in an hour.",
    } satisfies UploadMediaResult;
  }

  return uploadProfileMedia({
    file: coverImage,
    mediaType: "cover",
    profileId: context.userId,
    supabase: context.supabase,
    username: context.username,
  });
}
