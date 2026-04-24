"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCompetitiveProfile } from "@/lib/competitive/competitive-profile";
import {
  isCompetitiveRole,
  type CompetitiveRole,
} from "@/lib/competitive/competitive-profile-types";
import { HERO_ROSTER } from "@/lib/heroes/hero-roster";
import { getProfileHeroPools } from "@/lib/heroes/profile-hero-pools";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";
import { isLFGType, type CompetitiveProfileSnapshot } from "@/lib/lfg/lfg-post-types";
import { hasMatchingActiveLFGPost, insertLFGPost } from "@/lib/lfg/posts";

function lfgRedirect(
  lfgType: string,
  message: string,
  type: "error" | "success" = "error"
): never {
  const path = lfgType === "duos" ? "/duos" : `/${lfgType}`;
  const params = new URLSearchParams({ message, type });
  redirect(`${path}?${params.toString()}`);
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
  const lfgTypeValue = formData.get("lfg_type")?.toString().trim() ?? "";
  const title = formData.get("title")?.toString().trim() ?? "";
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
  const roleProfile =
    competitiveProfile.roles.find((role) => role.role === postingRole) ?? null;

  if (!roleProfile) {
    lfgRedirect(
      lfgTypeValue,
      `${postingRoleValue.toUpperCase()} is not set up in your Competitive Profile yet.`
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

  const hasDuplicateActivePost = await hasMatchingActiveLFGPost({
    lfgType: lfgTypeValue,
    postingRole,
    profileId: profile.id,
    title,
  });

  if (hasDuplicateActivePost) {
    lfgRedirect(
      lfgTypeValue,
      "You already have an active post in this section with this title.",
      "success"
    );
  }

  try {
    await insertLFGPost({
      competitiveProfileSnapshot,
      heroPoolSnapshot,
      lfgType: lfgTypeValue,
      platform: profile.platform ?? null,
      postingRole,
      profileId: profile.id,
      rankDivision: roleProfile.rankDivision,
      rankTier: roleProfile.rankTier,
      region: profile.region ?? null,
      timezone: profile.timezone ?? null,
      title,
    });
  } catch (error) {
    console.error("LFG post creation failed", {
      error,
      lfgType: lfgTypeValue,
      postingRole,
      profileId: profile.id,
    });
    lfgRedirect(lfgTypeValue, "Unable to create your post right now.");
  }

  revalidatePath(`/${lfgTypeValue}`);
  lfgRedirect(lfgTypeValue, "Post successfully uploaded.", "success");
}
