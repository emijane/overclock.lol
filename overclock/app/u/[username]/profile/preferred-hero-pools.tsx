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
    <section className="border-t px-5 py-4 [border-top-color:var(--profile-rank-border)] sm:px-6">
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
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border bg-white/[0.055] px-3.5 text-sm font-semibold text-zinc-50 shadow-[0_0_18px_var(--profile-rank-glow),inset_0_1px_0_rgba(255,255,255,0.1),0_10px_28px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all duration-200 [border-color:var(--profile-rank-border)] hover:bg-white/[0.075] hover:shadow-[0_0_24px_var(--profile-rank-glow),inset_0_1px_0_rgba(255,255,255,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </Link>
        ) : null}
      </div>

      {selectedHeroes.length === 0 ? (
        <div className="mt-3 rounded-[18px] border bg-white/[0.035] px-4 py-3 text-sm text-zinc-400 shadow-[0_0_18px_var(--profile-rank-glow),inset_0_1px_0_rgba(255,255,255,0.06)] [border-color:var(--profile-rank-border)]">
          Add your main roles and comfort heroes to show them here.
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-3 lg:gap-0">
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
                className="border-t pt-4 [border-top-color:var(--profile-rank-border)] first:border-t-0 first:pt-0 lg:border-l lg:border-t-0 lg:px-4 lg:pt-0 lg:[border-left-color:var(--profile-rank-border)] lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0"
              >
                <h3 className="text-sm font-semibold tracking-[-0.01em] text-zinc-100">
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
                            className="flex h-9 items-center gap-2 rounded-full border bg-white/[0.035] pl-1.5 pr-3 text-sm font-medium text-zinc-100 shadow-[0_0_12px_var(--profile-rank-glow),inset_0_1px_0_rgba(255,255,255,0.06)] [border-color:var(--profile-rank-border)]"
                          >
                            <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border bg-zinc-900 [border-color:var(--profile-rank-border)]">
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
