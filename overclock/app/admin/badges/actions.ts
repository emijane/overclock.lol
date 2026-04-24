"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { canAccessAdmin } from "@/lib/admin/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

function redirectToAdmin(message: string, type: "error" | "success", username?: string) {
  const params = new URLSearchParams({ message, type });

  if (username) {
    params.set("username", username);
  }

  redirect(`/admin/badges?${params.toString()}`);
}

async function requireAdminProfile() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/onboarding");
  }

  if (!canAccessAdmin(profile.username)) {
    notFound();
  }

  return profile;
}

function createBadgeClient() {
  try {
    return createAdminClient();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Supabase admin client is missing required environment variables."
    ) {
      redirectToAdmin(
        "Badge admin requires SUPABASE_SERVICE_ROLE_KEY in .env.local.",
        "error"
      );
    }

    throw error;
  }
}

export async function assignBadgeToUsername(formData: FormData) {
  const adminProfile = await requireAdminProfile();
  const username = formData.get("username")?.toString().trim().toLowerCase() ?? "";
  const badgeSlug = formData.get("badge_slug")?.toString().trim() ?? "";

  if (!username) {
    redirectToAdmin("Enter a username to assign a badge.", "error");
  }

  if (!badgeSlug) {
    redirectToAdmin("Choose a badge before assigning it.", "error", username);
  }

  const supabase = createBadgeClient();
  const [{ data: targetProfile, error: profileError }, { data: badge, error: badgeError }] =
    await Promise.all([
    supabase.from("profiles").select("id,username").eq("username", username).maybeSingle(),
    supabase.from("badges").select("id,slug,label").eq("slug", badgeSlug).maybeSingle(),
  ]);

  if (profileError) {
    throw profileError;
  }

  if (badgeError) {
    throw badgeError;
  }

  if (!targetProfile) {
    redirectToAdmin("That username does not exist.", "error", username);
  }

  if (!badge) {
    redirectToAdmin("That badge could not be found.", "error", username);
  }

  const { error } = await supabase.from("profile_badges").upsert(
    {
      badge_id: badge.id,
      granted_by: adminProfile.id,
      profile_id: targetProfile.id,
    },
    {
      onConflict: "profile_id,badge_id",
    }
  );

  if (error) {
    if (error.message.toLowerCase().includes("granted_by")) {
      const fallbackResult = await supabase.from("profile_badges").upsert(
        {
          badge_id: badge.id,
          profile_id: targetProfile.id,
        },
        {
          onConflict: "profile_id,badge_id",
        }
      );

      if (fallbackResult.error) {
        throw fallbackResult.error;
      }
    } else {
      throw error;
    }
  }

  revalidatePath(`/u/${targetProfile.username}`);
  revalidatePath("/admin/badges");
  redirectToAdmin(`${badge.label} assigned to @${targetProfile.username}.`, "success", username);
}

export async function removeBadgeFromUsername(formData: FormData) {
  await requireAdminProfile();
  const username = formData.get("username")?.toString().trim().toLowerCase() ?? "";
  const badgeSlug = formData.get("badge_slug")?.toString().trim() ?? "";

  if (!username || !badgeSlug) {
    redirectToAdmin("Choose a badge to remove.", "error", username || undefined);
  }

  const supabase = createBadgeClient();
  const [{ data: targetProfile, error: profileError }, { data: badge, error: badgeError }] =
    await Promise.all([
      supabase.from("profiles").select("id,username").eq("username", username).maybeSingle(),
      supabase.from("badges").select("id,label").eq("slug", badgeSlug).maybeSingle(),
    ]);

  if (profileError) {
    throw profileError;
  }

  if (badgeError) {
    throw badgeError;
  }

  if (!targetProfile || !badge) {
    redirectToAdmin("That badge assignment could not be found.", "error", username);
  }

  const { error } = await supabase
    .from("profile_badges")
    .delete()
    .eq("profile_id", targetProfile.id)
    .eq("badge_id", badge.id);

  if (error) {
    throw error;
  }

  revalidatePath(`/u/${targetProfile.username}`);
  revalidatePath("/admin/badges");
  redirectToAdmin(`${badge.label} removed from @${targetProfile.username}.`, "success", username);
}
