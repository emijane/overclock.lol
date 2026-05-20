"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCompetitiveProfile } from "@/lib/competitive/competitive-profile";
import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import {
  isCompetitiveRole,
  type CompetitiveRole,
} from "@/lib/competitive/competitive-profile-types";
import { HERO_ROSTER } from "@/lib/heroes/hero-roster";
import { getProfileHeroPools } from "@/lib/heroes/profile-hero-pools";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";
import { normalizeLFGPostTitle } from "@/lib/lfg/lfg-post-title";
import {
  isLFGGameMode,
  isShippedLFGType,
  LFG_POST_TITLE_MAX_CHARACTERS,
  normalizeLFGLookingForRoles,
  type CompetitiveProfileSnapshot,
  type LFGGameMode,
} from "@/lib/lfg/lfg-post-types";
import {
  closeOwnedActiveLFGPost,
  createLFGPostAtomically,
} from "@/lib/lfg/posts";

function getActionErrorText(error: unknown) {
  if (!error || typeof error !== "object") {
    return "";
  }

  const candidate = error as Record<string, unknown>;

  return [
    typeof candidate.code === "string" ? candidate.code : "",
    typeof candidate.message === "string" ? candidate.message : "",
    typeof candidate.details === "string" ? candidate.details : "",
    typeof candidate.hint === "string" ? candidate.hint : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getPublicStackDebugMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const candidate = error as Record<string, unknown>;
  const code = typeof candidate.code === "string" ? candidate.code : null;
  const message =
    typeof candidate.message === "string" ? candidate.message.trim() : null;

  if (!code && !message) {
    return null;
  }

  const compactMessage = message
    ? message.replace(/\s+/g, " ").slice(0, 120)
    : "Unknown stack create error";

  return `Stack debug: ${code ?? "no-code"} ${compactMessage}`;
}

function lfgRedirect(
  lfgType: string,
  message: string,
  type: "error" | "success" = "error"
): never {
  const path = lfgType === "duos" ? "/duos" : `/${lfgType}`;
  const params = new URLSearchParams({ message, type });
  redirect(`${path}?${params.toString()}`);
}

function redirectWithMessage(
  path: string,
  message: string,
  type: "error" | "success" = "error"
): never {
  const params = new URLSearchParams({ message, type });
  redirect(`${path}?${params.toString()}`);
}

function getSafeReturnPath(value: FormDataEntryValue | null) {
  const path = value?.toString().trim() ?? "";

  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return null;
  }

  return path;
}

function buildHeroPoolSnapshot(heroIds: string[]) {
  return heroIds
    .map((heroId) => HERO_ROSTER.find((hero) => hero.id === heroId) ?? null)
    .filter((hero): hero is (typeof HERO_ROSTER)[number] => Boolean(hero))
    .map((hero) => ({
      id: hero.id,
      imageSrc: hero.imageSrc,
      label: hero.label,
    }));
}

function getRequiredProfileError({
  platform,
  region,
  timezone,
}: {
  platform: string | null;
  region: string | null;
  timezone: string | null;
}) {
  if (!platform) {
    return "Choose your platform in your competitive profile before posting.";
  }

  if (!region) {
    return "Choose your region in your profile before posting.";
  }

  if (!timezone) {
    return "Choose your server in your profile before posting.";
  }

  return null;
}

export async function createLFGPost(formData: FormData) {
  const gameModeValue = formData.get("game_mode")?.toString().trim() ?? "";
  const lfgTypeValue = formData.get("lfg_type")?.toString().trim() ?? "";
  const lookingForRoles = normalizeLFGLookingForRoles(
    formData.getAll("looking_for_roles").map((value) => value.toString().trim())
  );
  const title = normalizeLFGPostTitle(formData.get("title")?.toString() ?? "");
  const postingRoleValue = formData.get("posting_role")?.toString().trim() ?? "";

  if (!isShippedLFGType(lfgTypeValue)) {
    redirect("/duos?message=Unable+to+create+that+post.&type=error");
  }

  if (!title) {
    lfgRedirect(lfgTypeValue, "Enter a title before posting.");
  }

  if (!isCompetitiveRole(postingRoleValue)) {
    lfgRedirect(lfgTypeValue, "Choose a role before posting.");
  }

  if (!isLFGGameMode(gameModeValue)) {
    lfgRedirect(lfgTypeValue, "Choose a mode before posting.");
  }

  if (title.length > LFG_POST_TITLE_MAX_CHARACTERS) {
    lfgRedirect(lfgTypeValue, `Title must be ${LFG_POST_TITLE_MAX_CHARACTERS} characters or fewer.`);
  }

  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/onboarding");
  }

  const [competitiveProfile, heroPools] = await Promise.all([
    getCompetitiveProfile(profile.id),
    getProfileHeroPools(profile.id),
  ]);
  const requiredProfileError = getRequiredProfileError({
    platform: competitiveProfile.platform,
    region: profile.region ?? null,
    timezone: profile.timezone ?? null,
  });

  if (requiredProfileError) {
    lfgRedirect(lfgTypeValue, requiredProfileError);
  }

  const postingRole = postingRoleValue as CompetitiveRole;
  const gameMode = gameModeValue as LFGGameMode;
  const roleProfile =
    competitiveProfile.roles.find((role) => role.role === postingRole) ?? null;

  if (!roleProfile) {
    lfgRedirect(
      lfgTypeValue,
      `${COMPETITIVE_ROLE_LABELS[postingRole]} is not set up in your Competitive Profile yet.`
    );
  }

  const heroPoolSnapshot = buildHeroPoolSnapshot(heroPools.heroPicks[postingRole] ?? []);
  const competitiveProfileSnapshot: CompetitiveProfileSnapshot = {
    hero_pool: heroPoolSnapshot,
    main_role: competitiveProfile.mainRole,
    platform: competitiveProfile.platform,
    posting_role: postingRole,
    rank_division: roleProfile.rankDivision,
    rank_tier: roleProfile.rankTier,
    region: profile.region ?? null,
    timezone: profile.timezone ?? null,
  };

  try {
    const result = await createLFGPostAtomically({
      competitiveProfileSnapshot,
      gameMode,
      heroPoolSnapshot,
      lfgType: lfgTypeValue,
      lookingForRoles,
      platform: competitiveProfile.platform,
      postingRole,
      profileId: profile.id,
      rankDivision: roleProfile.rankDivision,
      rankTier: roleProfile.rankTier,
      region: profile.region ?? null,
      timezone: profile.timezone ?? null,
      title,
    });

    if (!result.created) {
      if (result.errorCode === "duplicate_active_post") {
        lfgRedirect(
          lfgTypeValue,
          "You already have an active post in this section with this title."
        );
      }

      if (result.errorCode === "active_slot_limit") {
        lfgRedirect(
          lfgTypeValue,
          "You already have the maximum number of active posts for this role."
        );
      }

      if (result.errorCode === "create_rate_limit") {
        lfgRedirect(
          lfgTypeValue,
          "You've created too many posts recently. Try again later."
        );
      }

      if (result.errorCode === "already_in_active_stack") {
        lfgRedirect(
          lfgTypeValue,
          "You already belong to an active stack. Leave or close it before creating another."
        );
      }

      if (
        result.errorCode === "unauthenticated" ||
        result.errorCode === "forbidden"
      ) {
        redirect("/login");
      }

      lfgRedirect(lfgTypeValue, "Unable to create your post right now.");
    }
  } catch (error) {
    console.error("LFG post creation failed", {
      error,
      lfgType: lfgTypeValue,
      postingRole,
      profileId: profile.id,
    });

    const errorText = getActionErrorText(error);

    if (
      lfgTypeValue === "stacks" &&
      (errorText.includes("create_lfg_post_atomic") ||
        errorText.includes("stack_members") ||
        errorText.includes("expire_stack_posts"))
    ) {
      const debugMessage = getPublicStackDebugMessage(error);

      lfgRedirect(
        lfgTypeValue,
        debugMessage ?? "Stacks are still syncing on the server. Try again in a moment."
      );
    }

    lfgRedirect(lfgTypeValue, "Unable to create your post right now.");
  }

  revalidatePath(`/${lfgTypeValue}`);
  revalidatePath("/lfg");
  if (profile.username) {
    revalidatePath(`/u/${profile.username}`);
  }
  lfgRedirect(lfgTypeValue, "Post successfully uploaded.", "success");
}

export async function closeLFGPost(formData: FormData) {
  const postId = formData.get("post_id")?.toString().trim() ?? "";
  const fallbackPath = getSafeReturnPath(formData.get("return_path")) ?? "/duos";
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/onboarding");
  }

  if (!postId) {
    redirectWithMessage(fallbackPath, "Unable to close that post.");
  }

  let result: Awaited<ReturnType<typeof closeOwnedActiveLFGPost>>;

  try {
    result = await closeOwnedActiveLFGPost({
      postId,
      profileId: profile.id,
    });
  } catch (error) {
    console.error("LFG post close failed", {
      error,
      postId,
      profileId: profile.id,
    });
    redirectWithMessage(fallbackPath, "Unable to close that post right now.");
  }

  const redirectPath = result.lfgType ? `/${result.lfgType}` : fallbackPath;
  const returnPath =
    fallbackPath.startsWith("/u/") || fallbackPath === "/lfg"
      ? fallbackPath
      : redirectPath;

  if (!result.updated) {
    redirectWithMessage(returnPath, "That post is no longer active.");
  }

  revalidatePath(redirectPath);
  if (profile.username) {
    revalidatePath(`/u/${profile.username}`);
  }

  redirectWithMessage(returnPath, "Post closed.", "success");
}
