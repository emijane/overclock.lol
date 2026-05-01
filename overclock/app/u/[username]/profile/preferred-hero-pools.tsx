import Image from "next/image";
import Link from "next/link";
import { PencilIcon } from "lucide-react";

import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import { getRankIconSrc } from "@/lib/competitive/rank-icons";
import type {
  CompetitiveProfile,
  CompetitiveRole,
} from "@/lib/competitive/competitive-profile-types";
import {
  HERO_POOL_GROUPS,
  HERO_ROSTER,
  type HeroDefinition,
  type HeroPoolRole,
} from "@/lib/heroes/hero-roster";
import {
  type HeroPoolRoleOption,
  type HeroPoolSelections,
} from "@/lib/heroes/profile-hero-pools";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";

type PreferredHeroPoolsProps = {
  competitiveProfile: CompetitiveProfile;
  heroPicks: HeroPoolSelections;
  isOwner: boolean;
  roles: HeroPoolRoleOption[];
};

const GROUP_ROLE_BY_LABEL: Record<string, CompetitiveRole> = {
  Tank: "tank",
  DPS: "dps",
  Support: "support",
};

function getOrderedHeroPoolGroups(mainRole: CompetitiveRole | null) {
  if (!mainRole) {
    return HERO_POOL_GROUPS;
  }

  return [...HERO_POOL_GROUPS].sort((firstGroup, secondGroup) => {
    const firstRole = GROUP_ROLE_BY_LABEL[firstGroup.label];
    const secondRole = GROUP_ROLE_BY_LABEL[secondGroup.label];

    if (firstRole === mainRole) {
      return -1;
    }

    if (secondRole === mainRole) {
      return 1;
    }

    return 0;
  });
}

const roleStatusClassName = {
  "Main role": "text-sky-200/80",
} as const;

function getHeroesForRole(
  role: HeroPoolRoleOption,
  heroPicks: HeroPoolSelections
): HeroDefinition[] {
  return heroPicks[role]
    .map((heroId) => HERO_ROSTER.find((hero) => hero.id === heroId))
    .filter((hero): hero is HeroDefinition => Boolean(hero));
}

export function PreferredHeroPools({
  competitiveProfile,
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
    <section className="border-t border-white/10 px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-zinc-50">
            Competitive Roles
          </h2>
        </div>

        {isOwner ? (
          <Link
            href="/account/competitive"
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3.5 text-sm font-semibold text-zinc-50 backdrop-blur-md transition-all duration-200 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </Link>
        ) : null}
      </div>

      {selectedHeroes.length === 0 ? (
        <div className="mt-4 rounded-[18px] border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-zinc-400">
          Add your main roles and comfort heroes to show them here.
        </div>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-3 lg:gap-3">
          {getOrderedHeroPoolGroups(competitiveProfile.mainRole).map((group) => {
            const groupRole = GROUP_ROLE_BY_LABEL[group.label];
            const roleProfile = competitiveProfile.roles.find(
              (roleProfile) => roleProfile.role === groupRole
            );
            const rankIconSrc = getRankIconSrc(roleProfile?.rankTier);
            const roleStatus =
              competitiveProfile.mainRole === groupRole
                ? "Main role"
                : null;
            const visibleHeroes = group.pools.flatMap((pool) => derivedPools[pool]);

            if (visibleHeroes.length === 0) {
              return null;
            }

            return (
              <section
                key={group.label}
                className="rounded-[18px] border border-white/10 bg-white/[0.02] p-3.5 transition-all duration-200 hover:bg-white/[0.04]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-zinc-100">
                      {COMPETITIVE_ROLE_LABELS[groupRole]}
                    </h3>
                    {roleProfile ? (
                      <div className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-zinc-300">
                        {rankIconSrc ? (
                          <span className="relative h-3.5 w-3.5 shrink-0">
                            <Image
                              src={rankIconSrc}
                              alt={`${roleProfile.rankTier} rank icon`}
                              fill
                              className="object-contain"
                              sizes="14px"
                            />
                          </span>
                        ) : null}
                        <span>
                          {formatCurrentRank(
                            roleProfile.rankTier,
                            roleProfile.rankDivision
                          )}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {roleStatus ? (
                    <span
                      className={`shrink-0 text-[10px] font-medium uppercase tracking-[0.14em] ${roleStatusClassName[roleStatus]}`}
                    >
                      {roleStatus}
                    </span>
                  ) : null}
                </div>

                <div className="mt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {visibleHeroes.map((hero) => (
                      <div
                        key={hero.id}
                        title={hero.label}
                        className="relative h-9 w-9 shrink-0 overflow-hidden rounded-[10px] border border-white/10 bg-zinc-900"
                      >
                        <Image
                          src={hero.imageSrc}
                          alt={hero.label}
                          fill
                          className="object-cover"
                          sizes="(min-width: 640px) 40px, 36px"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
