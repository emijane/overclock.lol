"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  PROFILE_COVER_IMAGE_MAX_BYTES,
  PROFILE_MEDIA_BUCKET,
  PROFILE_MEDIA_IMAGE_MIME_TYPES,
  getProfileCoverPath,
} from "@/lib/profiles/profile-media";
import { createClient } from "@/lib/supabase/server";

function profileRedirect(
  username: string,
  message: string,
  type: "error" | "success" = "error"
): never {
  const params = new URLSearchParams({ type, message });
  redirect(`/u/${username}?${params.toString()}`);
}

export async function uploadProfileCover(formData: FormData) {
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

  const coverImage = formData.get("cover_image");

  if (!(coverImage instanceof File) || coverImage.size === 0) {
    profileRedirect(ownerProfile.username, "Choose a cover image to upload.");
  }

  if (!PROFILE_MEDIA_IMAGE_MIME_TYPES.some((type) => type === coverImage.type)) {
    profileRedirect(
      ownerProfile.username,
      "Cover image must be a JPG, PNG, or WebP file."
    );
  }

  if (coverImage.size > PROFILE_COVER_IMAGE_MAX_BYTES) {
    profileRedirect(ownerProfile.username, "Cover image must be 5 MB or smaller.");
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
    const uploadErrorMessage = uploadError.message.toLowerCase();

    if (
      uploadErrorMessage.includes("row-level security") ||
      uploadErrorMessage.includes("permission") ||
      uploadErrorMessage.includes("not authorized")
    ) {
      profileRedirect(
        ownerProfile.username,
        "Cover upload is blocked by storage policy. Add the profile-media upload policies first."
      );
    }

    profileRedirect(
      ownerProfile.username,
      "Unable to upload your cover image right now."
    );
  }

  const coverImageUpdatedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      cover_image_path: coverImagePath,
      cover_image_updated_at: coverImageUpdatedAt,
    })
    .eq("id", user.id);

  if (updateError) {
    profileRedirect(
      ownerProfile.username,
      "Cover image uploaded, but we could not save it to your profile."
    );
  }

  revalidatePath("/account");
  revalidatePath(`/u/${ownerProfile.username}`);
  profileRedirect(ownerProfile.username, "Cover image updated.", "success");
}
