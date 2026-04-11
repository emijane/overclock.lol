"use server";

import { redirect } from "next/navigation";

import { HERO_ROSTER } from "@/lib/heroes/hero-roster";
import {
  HERO_POOL_ROLE_OPTIONS,
  isHeroPoolRoleOption,
  normalizeHeroPoolSelections,
  saveProfileHeroPools,
  type HeroPoolRoleOption,
} from "@/lib/heroes/profile-hero-pools";
import { createClient } from "@/lib/supabase/server";

const HERO_LIMIT = 5;
const VALID_HERO_IDS = new Set(HERO_ROSTER.map((hero) => hero.id));

function heroPoolsRedirect(
  message: string,
  type: "error" | "success" = "error"
): never {
  const params = new URLSearchParams({ type, message });
  redirect(`/account/hero-pools?${params.toString()}`);
}

function isValidHeroForRole(role: HeroPoolRoleOption, heroId: string) {
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

// The UI submits local state as JSON. Validate it server-side before writing
// so the dedicated hero-pool table only stores known roles and hero ids.
export async function saveHeroPools(formData: FormData) {
  const rawRoles = formData.get("roles");
  const rawHeroPicks = formData.get("hero_picks");

  let parsedRoles: string[] = [];
  let parsedHeroPicks = normalizeHeroPoolSelections(null);

  try {
    parsedRoles = rawRoles ? JSON.parse(rawRoles.toString()) : [];
    parsedHeroPicks = normalizeHeroPoolSelections(
      rawHeroPicks ? JSON.parse(rawHeroPicks.toString()) : null
    );
  } catch {
    heroPoolsRedirect("Unable to read your hero pool selections.");
  }

  if (!Array.isArray(parsedRoles)) {
    heroPoolsRedirect("Invalid hero pool roles.");
  }

  const roles = parsedRoles.filter(
    (role): role is HeroPoolRoleOption =>
      typeof role === "string" && isHeroPoolRoleOption(role)
  );

  for (const role of HERO_POOL_ROLE_OPTIONS) {
    const picks = parsedHeroPicks[role];

    if (picks.length > HERO_LIMIT) {
      heroPoolsRedirect("You can only choose up to five heroes per role.");
    }

    if (new Set(picks).size !== picks.length) {
      heroPoolsRedirect("Duplicate heroes are not allowed.");
    }

    const invalidHero = picks.find(
      (heroId) => !VALID_HERO_IDS.has(heroId) || !isValidHeroForRole(role, heroId)
    );

    if (invalidHero) {
      heroPoolsRedirect("One or more selected heroes are invalid.");
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  try {
    await saveProfileHeroPools(user.id, {
      heroPicks: parsedHeroPicks,
      roles,
    });
  } catch {
    heroPoolsRedirect("Unable to save your hero pools right now.");
  }

  heroPoolsRedirect("Hero pools saved.", "success");
}
