"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  detectFeaturedClipPlatform,
  FEATURED_CLIP_PLATFORMS,
  getYouTubeThumbnailUrl,
  normalizeFeaturedClipUrl,
  sanitizeFeaturedClipTitle,
  validateFeaturedClipInput,
} from "@/lib/profiles/featured-clip-shared";
import {
  getProfileFeaturedClips,
  getYouTubeOEmbedMetadata,
} from "@/lib/profiles/profile-featured-clips";
import { createClient } from "@/lib/supabase/server";

export type SaveFeaturedClipResult =
  | { status: "idle"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export async function saveFeaturedClip(
  _previousState: SaveFeaturedClipResult,
  formData: FormData
): Promise<SaveFeaturedClipResult> {
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

  const clipId = formData.get("clip_id")?.toString().trim() ?? "";
  const title = sanitizeFeaturedClipTitle(formData.get("title"));
  const url = normalizeFeaturedClipUrl(formData.get("url")?.toString() ?? "");
  const validationError = validateFeaturedClipInput({ title, url });

  if (validationError) {
    return { status: "error", message: validationError };
  }

  const platform = detectFeaturedClipPlatform(url);

  if (!platform || !FEATURED_CLIP_PLATFORMS.includes(platform)) {
    return {
      status: "error",
      message: "Only YouTube URLs are supported right now.",
    };
  }

  const youtubeMetadata = await getYouTubeOEmbedMetadata(url);
  const resolvedTitle = title ?? youtubeMetadata?.title ?? null;
  const resolvedThumbnailUrl =
    youtubeMetadata?.thumbnailUrl ?? getYouTubeThumbnailUrl(url);

  const existingClips = await getProfileFeaturedClips(user.id);
  const existingClip = clipId
    ? existingClips.find((clip) => clip.id === clipId) ?? null
    : null;

  if (clipId && !existingClip) {
    return { status: "error", message: "Featured video could not be found." };
  }

  const nextPosition =
    existingClip?.position ??
    [1, 2].find((position) => !existingClips.some((clip) => clip.position === position));

  if (!nextPosition) {
    return { status: "error", message: "You can only save up to two featured videos." };
  }

  const payload = {
    platform,
    position: nextPosition,
    profile_id: user.id,
    thumbnail_url: resolvedThumbnailUrl,
    title: resolvedTitle,
    url,
  };

  const query = clipId
    ? supabase
        .from("profile_featured_clips")
        .update(payload)
        .eq("id", clipId)
        .eq("profile_id", user.id)
    : supabase.from("profile_featured_clips").insert(payload);

  const { error } = await query;

  if (error) {
    console.error("Saving featured clip failed", {
      clipId: clipId || null,
      error,
      profileId: user.id,
    });
    return {
      status: "error",
      message: "Unable to save featured video right now.",
    };
  }

  revalidatePath(`/u/${ownerProfile.username}`);
  return { status: "success", message: "Featured video saved." };
}

export async function deleteFeaturedClip(clipId: string) {
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

  const { error } = await supabase
    .from("profile_featured_clips")
    .delete()
    .eq("id", clipId)
    .eq("profile_id", user.id);

  if (error) {
    console.error("Deleting featured clip failed", {
      clipId,
      error,
      profileId: user.id,
    });
    return { status: "error", message: "Unable to remove featured video right now." };
  }

  const remainingClips = await getProfileFeaturedClips(user.id);

  await Promise.all(
    remainingClips.map((clip, index) =>
      supabase
        .from("profile_featured_clips")
        .update({ position: index + 1 })
        .eq("id", clip.id)
        .eq("profile_id", user.id)
    )
  );

  revalidatePath(`/u/${ownerProfile.username}`);
  return { status: "success", message: "Featured video removed." };
}
