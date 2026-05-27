import { cache } from "react";
import { unstable_cache } from "next/cache";

import { createClient, getServerClient } from "@/lib/supabase/server";

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

export const HERO_POOLS_CACHE_TAG = (profileId: string) =>
  `hero-pools:${profileId}`;

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

async function fetchProfileHeroPools(profileId: string) {
  const supabase = await getServerClient();
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

// Per-request deduplication via react.cache, cross-request persistence via
// unstable_cache. Invalidate with revalidateTag(HERO_POOLS_CACHE_TAG(profileId)).
export const getProfileHeroPools = cache((profileId: string) =>
  unstable_cache(fetchProfileHeroPools, [`hero-pools:${profileId}`], {
    tags: [HERO_POOLS_CACHE_TAG(profileId)],
  })(profileId)
);

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
