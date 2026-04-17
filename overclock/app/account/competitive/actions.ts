"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  isCompetitiveRole,
  type CompetitiveRole,
  type CompetitiveRankTier,
} from "@/lib/competitive/competitive-profile-types";
import { HERO_ROSTER } from "@/lib/heroes/hero-roster";
import {
  getProfileHeroPools,
  saveProfileHeroPools,
  type HeroPoolSelections,
} from "@/lib/heroes/profile-hero-pools";
import { RANK_TIERS } from "@/lib/profiles/profile-options";
import { createClient } from "@/lib/supabase/server";

const HERO_LIMIT = 5;
const VALID_HERO_IDS = new Set(HERO_ROSTER.map((hero) => hero.id));

function competitiveRedirect(
  message: string,
  type: "error" | "success" = "error"
): never {
  const params = new URLSearchParams({ type, message });
  redirect(`/account/competitive?${params.toString()}`);
}

function optionalTrimmedString(value: FormDataEntryValue | null) {
  const parsed = value?.toString().trim() ?? "";
  return parsed.length > 0 ? parsed : null;
}

function parseRankDivision(value: FormDataEntryValue | null) {
  const parsed = optionalTrimmedString(value);

  if (!parsed) {
    return null;
  }

  const division = Number(parsed);

  if (!Number.isInteger(division) || division < 1 || division > 5) {
    competitiveRedirect("Invalid rank division.");
  }

  return division;
}

function parseRankTier(value: FormDataEntryValue | null): CompetitiveRankTier {
  const parsed = optionalTrimmedString(value);

  if (!parsed || !RANK_TIERS.includes(parsed as CompetitiveRankTier)) {
    competitiveRedirect("Invalid rank tier.");
  }

  return parsed as CompetitiveRankTier;
}

function validateRankPair(tier: CompetitiveRankTier, division: number | null) {
  if (tier === "Unranked" && division !== null) {
    competitiveRedirect("Division must be empty when rank is Unranked.");
  }

  if (tier !== "Unranked" && division === null) {
    competitiveRedirect("Division is required for ranked roles.");
  }
}

function isValidHeroForRole(role: CompetitiveRole, heroId: string) {
  const hero = HERO_ROSTER.find((item) => item.id === heroId);

  if (!hero) {
    return false;
  }

  if (role === "tank") {
    return ["main_tank", "off_tank"].includes(hero.pool);
  }

  if (role === "dps") {
    return ["dps_hitscan", "dps_flex"].includes(hero.pool);
  }

  return ["support_main", "support_flex"].includes(hero.pool);
}

function parseHeroIds(value: FormDataEntryValue | null, role: CompetitiveRole) {
  let parsed: unknown = [];

  try {
    parsed = value ? JSON.parse(value.toString()) : [];
  } catch {
    competitiveRedirect("Unable to read hero pool selections.");
  }

  if (!Array.isArray(parsed)) {
    competitiveRedirect("Invalid hero pool selections.");
  }

  const heroIds = parsed.filter((item): item is string => typeof item === "string");

  if (heroIds.length > HERO_LIMIT) {
    competitiveRedirect("You can only choose up to five heroes per role.");
  }

  if (new Set(heroIds).size !== heroIds.length) {
    competitiveRedirect("Duplicate heroes are not allowed.");
  }

  const invalidHero = heroIds.find(
    (heroId) => !VALID_HERO_IDS.has(heroId) || !isValidHeroForRole(role, heroId)
  );

  if (invalidHero) {
    competitiveRedirect("One or more selected heroes are invalid.");
  }

  return heroIds;
}

function mergeRoleHeroPool(
  currentHeroPools: Awaited<ReturnType<typeof getProfileHeroPools>>,
  role: CompetitiveRole,
  heroIds: string[]
) {
  const heroPicks: HeroPoolSelections = {
    ...currentHeroPools.heroPicks,
    [role]: heroIds,
  };
  const roleSet = new Set(currentHeroPools.roles);

  if (heroIds.length > 0) {
    roleSet.add(role);
  } else {
    roleSet.delete(role);
  }

  return {
    heroPicks,
    roles: Array.from(roleSet),
  };
}

export async function saveCompetitiveRoleProfile(formData: FormData) {
  const rawRole = optionalTrimmedString(formData.get("role"));

  if (!rawRole || !isCompetitiveRole(rawRole)) {
    competitiveRedirect("Invalid competitive role.");
  }

  const rankTier = parseRankTier(formData.get("rank_tier"));
  const rankDivision = parseRankDivision(formData.get("rank_division"));
  const shouldSetMainRole = formData.get("main_role") === "on";
  const wasMainRole = formData.get("was_main_role") === "true";
  const heroIds = parseHeroIds(formData.get("hero_ids"), rawRole);

  validateRankPair(rankTier, rankDivision);

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { error: roleError } = await supabase
    .from("competitive_role_profiles")
    .upsert(
      {
        enabled: true,
        profile_id: user.id,
        rank_division: rankDivision,
        rank_tier: rankTier,
        role: rawRole,
      },
      {
        onConflict: "profile_id,role",
      }
    );

  if (roleError) {
    console.error("Competitive role profile save failed", {
      error: roleError,
      profileId: user.id,
      role: rawRole,
    });
    competitiveRedirect("Unable to save competitive role right now.");
  }

  if (shouldSetMainRole || wasMainRole) {
    const { error: profileError } = await supabase
      .from("competitive_profiles")
      .upsert(
        {
          main_role: shouldSetMainRole ? rawRole : null,
          profile_id: user.id,
        },
        {
          onConflict: "profile_id",
        }
      );

    if (profileError) {
      console.error("Competitive profile main role save failed", {
        error: profileError,
        profileId: user.id,
        role: rawRole,
      });
      competitiveRedirect("Saved rank, but could not set main role.");
    }
  }

  try {
    const currentHeroPools = await getProfileHeroPools(user.id);
    const nextHeroPools = mergeRoleHeroPool(currentHeroPools, rawRole, heroIds);
    await saveProfileHeroPools(user.id, nextHeroPools);
  } catch (error) {
    console.error("Competitive role hero pool save failed", {
      error,
      profileId: user.id,
      role: rawRole,
    });
    competitiveRedirect("Saved rank, but could not save hero pool.");
  }

  revalidatePath("/account/competitive");
  competitiveRedirect("Competitive role saved.", "success");
}
