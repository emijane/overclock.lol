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
  isLFGType,
  normalizeLFGLookingForRoles,
  type CompetitiveProfileSnapshot,
  type LFGGameMode,
} from "@/lib/lfg/lfg-post-types";
import {
  closeOwnedActiveLFGPost,
  createLFGPostAtomically,
  hasMatchingActiveLFGPost,
  hasReachedActiveLFGPostLimit,
  hasReachedLFGPostCreationLimit,
} from "@/lib/lfg/posts";

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

  if (!path.startsWith("/") || path.startsWith("//")) {
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
    return "Choose your platform in your profile before posting.";
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

  if (!isLFGType(lfgTypeValue)) {
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

  if (title.length > 80) {
    lfgRedirect(lfgTypeValue, "Title must be 80 characters or fewer.");
  }

  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/onboarding");
  }

  const requiredProfileError = getRequiredProfileError({
    platform: profile.platform ?? null,
    region: profile.region ?? null,
    timezone: profile.timezone ?? null,
  });

  if (requiredProfileError) {
    lfgRedirect(lfgTypeValue, requiredProfileError);
  }

  const [competitiveProfile, heroPools] = await Promise.all([
    getCompetitiveProfile(profile.id),
    getProfileHeroPools(profile.id),
  ]);

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

  const heroPoolSnapshot = buildHeroPoolSnapshot(heroPools.heroPicks[postingRole]);
  const competitiveProfileSnapshot: CompetitiveProfileSnapshot = {
    hero_pool: heroPoolSnapshot,
    main_role: competitiveProfile.mainRole,
    platform: profile.platform ?? null,
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
      platform: profile.platform ?? null,
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
          `You can only keep 2 active ${COMPETITIVE_ROLE_LABELS[postingRole]} posts in this section at once. Close one of your active posts or wait for it to expire before posting again.`
        );
      }

      if (result.errorCode === "create_rate_limit") {
        lfgRedirect(
          lfgTypeValue,
          "You can create up to 4 posts in this section per rolling 60 minutes. Closing or removing a post does not reset that limit, so wait until one of your recent post timestamps ages out before posting again."
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

    let hasDuplicateActivePost = false;
    let hasReachedActiveSlotLimit = false;
    let hasReachedRateLimit = false;

    try {
      [hasDuplicateActivePost, hasReachedActiveSlotLimit, hasReachedRateLimit] =
        await Promise.all([
          hasMatchingActiveLFGPost({
            gameMode,
            lfgType: lfgTypeValue,
            postingRole,
            profileId: profile.id,
            title,
          }),
          hasReachedActiveLFGPostLimit({
            lfgType: lfgTypeValue,
            postingRole,
            profileId: profile.id,
          }),
          hasReachedLFGPostCreationLimit({
            lfgType: lfgTypeValue,
            profileId: profile.id,
          }),
        ]);
    } catch (diagnosticError) {
      console.error("LFG post creation diagnostics failed", {
        diagnosticError,
        lfgType: lfgTypeValue,
        postingRole,
        profileId: profile.id,
      });
    }

    if (hasDuplicateActivePost) {
      lfgRedirect(
        lfgTypeValue,
        "You already have an active post in this section with this title."
      );
    }

    if (hasReachedActiveSlotLimit) {
      lfgRedirect(
        lfgTypeValue,
        `You can only keep 2 active ${COMPETITIVE_ROLE_LABELS[postingRole]} posts in this section at once. Close one of your active posts or wait for it to expire before posting again.`
      );
    }

    if (hasReachedRateLimit) {
      lfgRedirect(
        lfgTypeValue,
        "You can create up to 4 posts in this section per rolling 60 minutes. Closing or removing a post does not reset that limit, so wait until one of your recent post timestamps ages out before posting again."
      );
    }

    lfgRedirect(lfgTypeValue, "Unable to create your post right now.");
  }

  revalidatePath(`/${lfgTypeValue}`);
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
