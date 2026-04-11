import { createClient } from "@/lib/supabase/server";

export const HERO_POOL_ROLE_OPTIONS = ["tank", "dps", "support"] as const;

export type HeroPoolRoleOption = (typeof HERO_POOL_ROLE_OPTIONS)[number];

export type HeroPoolSelections = Record<HeroPoolRoleOption, string[]>;

export type ProfileHeroPools = {
  heroPicks: HeroPoolSelections;
  roles: HeroPoolRoleOption[];
};

export const EMPTY_HERO_POOL_SELECTIONS: HeroPoolSelections = {
  tank: [],
  dps: [],
  support: [],
};

export const EMPTY_PROFILE_HERO_POOLS: ProfileHeroPools = {
  heroPicks: EMPTY_HERO_POOL_SELECTIONS,
  roles: [],
};

export function isHeroPoolRoleOption(
  value: string
): value is HeroPoolRoleOption {
  return HERO_POOL_ROLE_OPTIONS.includes(value as HeroPoolRoleOption);
}

// Supabase returns jsonb as unknown-ish data. Normalize it into the exact shape
// the UI expects so the page can always render with stable defaults.
export function normalizeHeroPoolSelections(
  value: unknown
): HeroPoolSelections {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return EMPTY_HERO_POOL_SELECTIONS;
  }

  const candidate = value as Partial<Record<HeroPoolRoleOption, unknown>>;

  return {
    tank: Array.isArray(candidate.tank)
      ? candidate.tank.filter((item): item is string => typeof item === "string")
      : [],
    dps: Array.isArray(candidate.dps)
      ? candidate.dps.filter((item): item is string => typeof item === "string")
      : [],
    support: Array.isArray(candidate.support)
      ? candidate.support.filter((item): item is string => typeof item === "string")
      : [],
  };
}

function normalizeHeroPoolRoles(value: unknown): HeroPoolRoleOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is HeroPoolRoleOption =>
      typeof item === "string" && isHeroPoolRoleOption(item)
  );
}

export async function getProfileHeroPools(profileId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_hero_pools")
    .select("roles, hero_picks")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return EMPTY_PROFILE_HERO_POOLS;
  }

  return {
    heroPicks: normalizeHeroPoolSelections(data.hero_picks),
    roles: normalizeHeroPoolRoles(data.roles),
  } satisfies ProfileHeroPools;
}

export async function saveProfileHeroPools(
  profileId: string,
  heroPools: ProfileHeroPools
) {
  const supabase = await createClient();
  const { error } = await supabase.from("profile_hero_pools").upsert(
    {
      profile_id: profileId,
      roles: heroPools.roles,
      hero_picks: heroPools.heroPicks,
    },
    {
      onConflict: "profile_id",
    }
  );

  if (error) {
    throw error;
  }
}
