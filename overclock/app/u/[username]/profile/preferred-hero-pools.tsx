import Image from "next/image";
import Link from "next/link";
import { PencilIcon } from "lucide-react";

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
  isOwner: boolean;
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
  isOwner,
  roles,
}: PreferredHeroPoolsProps) {
  const selectedHeroes = roles.flatMap((role) => getHeroesForRole(role, heroPicks));

  if (selectedHeroes.length === 0 && !isOwner) {
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
    <section className="border-t border-white/10 px-5 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-zinc-50">
            Hero pools
          </h2>
          <p className="mt-0.5 text-sm leading-5 text-zinc-400">
            Main roles and comfort picks for ranked play.
          </p>
        </div>

        {isOwner ? (
          <Link
            href="/account/hero-pools"
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-white/12 bg-white/[0.055] px-3.5 text-sm font-semibold text-zinc-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_28px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all duration-200 hover:border-sky-300/35 hover:bg-sky-300/10 hover:shadow-[0_0_24px_rgba(56,189,248,0.16),inset_0_1px_0_rgba(255,255,255,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </Link>
        ) : null}
      </div>

      {selectedHeroes.length === 0 ? (
        <div className="mt-3 rounded-[18px] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-zinc-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          Add your main roles and comfort heroes to show them here.
        </div>
      ) : (
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
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
                className="rounded-[18px] border border-white/10 bg-white/[0.035] px-3.5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              >
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-zinc-300">
                  {group.label}
                </h3>

                <div className="mt-3 grid gap-3">
                  {visiblePools.map((pool) => (
                    <div key={pool} className="grid gap-1.5">
                      <p className="text-[12px] font-medium text-zinc-500">
                        {HERO_POOL_LABELS[pool]}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {derivedPools[pool].map((hero) => (
                          <div
                            key={hero.id}
                            className="flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] pl-1.5 pr-3 text-sm font-medium text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                          >
                            <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-white/10 bg-zinc-900">
                              <Image
                                src={hero.imageSrc}
                                alt={hero.label}
                                fill
                                className="object-cover"
                                sizes="28px"
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
      )}
    </section>
  );
}
