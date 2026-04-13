import Image from "next/image";

import {
  HERO_POOL_GROUPS,
  HERO_POOL_LABELS,
  HERO_ROSTER,
  type HeroDefinition,
  type HeroPoolRole,
} from "@/lib/heroes/hero-roster";
import {
  type HeroPoolRoleOption,
  type HeroPoolSelections,
} from "@/lib/heroes/profile-hero-pools";

type PreferredHeroPoolsProps = {
  heroPicks: HeroPoolSelections;
  roles: HeroPoolRoleOption[];
};

function getHeroesForRole(
  role: HeroPoolRoleOption,
  heroPicks: HeroPoolSelections
): HeroDefinition[] {
  return heroPicks[role]
    .map((heroId) => HERO_ROSTER.find((hero) => hero.id === heroId))
    .filter((hero): hero is HeroDefinition => Boolean(hero));
}

export function PreferredHeroPools({
  heroPicks,
  roles,
}: PreferredHeroPoolsProps) {
  const selectedHeroes = roles.flatMap((role) => getHeroesForRole(role, heroPicks));

  if (selectedHeroes.length === 0) {
    return null;
  }

  const derivedPools = selectedHeroes.reduce<Record<HeroPoolRole, HeroDefinition[]>>(
    (accumulator, hero) => {
      accumulator[hero.pool].push(hero);
      return accumulator;
    },
    {
      main_tank: [],
      off_tank: [],
      dps_hitscan: [],
      dps_flex: [],
      support_main: [],
      support_flex: [],
    }
  );

  return (
    <section className="rounded-[28px] border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 px-5 py-4 sm:px-6">
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-zinc-50">
          Hero pools
        </h2>
        <p className="mt-1 text-[15px] leading-6 text-zinc-400">
          Overwatch 2 main roles, hero pool picks, and comfort heroes for ranked play.
        </p>
      </div>

      <div className="grid gap-4 px-5 py-5 sm:px-6">
        {HERO_POOL_GROUPS.map((group) => {
          const visiblePools = group.pools.filter(
            (pool) => derivedPools[pool].length > 0
          );

          if (visiblePools.length === 0) {
            return null;
          }

          return (
            <section
              key={group.label}
              className="rounded-[22px] border border-zinc-800 bg-zinc-950/70 px-4 py-4"
            >
              <h3 className="text-sm font-semibold text-zinc-100">
                {group.label}
              </h3>

              <div className="mt-4 grid gap-4">
                {visiblePools.map((pool) => (
                  <div key={pool} className="grid gap-2">
                    <p className="text-sm text-zinc-400">
                      {HERO_POOL_LABELS[pool]}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {derivedPools[pool].map((hero) => (
                        <div
                          key={hero.id}
                          className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200"
                        >
                          <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-zinc-800 bg-zinc-900">
                            <Image
                              src={hero.imageSrc}
                              alt={hero.label}
                              fill
                              className="object-cover"
                              sizes="24px"
                            />
                          </div>
                          <span>{hero.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
