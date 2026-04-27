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
  "Main role": "border-sky-300/35 bg-sky-300/10 text-sky-100",
  "Off role": "border-amber-300/30 bg-amber-300/10 text-amber-100",
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
    <section className="border-t border-white/10 px-5 pb-6 pt-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:px-6 sm:pb-7">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-zinc-50">
            Competitive Roles
          </h2>
        </div>

        {isOwner ? (
          <Link
            href="/account/competitive"
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-white/12 bg-white/[0.055] px-3.5 text-sm font-semibold text-zinc-50 backdrop-blur-md transition-all duration-200 hover:border-sky-300/35 hover:bg-sky-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
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
        <div className="mt-3 grid gap-3 lg:grid-cols-3 lg:gap-0">
          {getOrderedHeroPoolGroups(competitiveProfile.mainRole).map((group) => {
            const groupRole = GROUP_ROLE_BY_LABEL[group.label];
            const roleProfile = competitiveProfile.roles.find(
              (roleProfile) => roleProfile.role === groupRole
            );
            const rankIconSrc = getRankIconSrc(roleProfile?.rankTier);
            const roleStatus =
              competitiveProfile.mainRole === groupRole
                ? "Main role"
                : roleProfile
                  ? "Off role"
                  : null;
            const visibleHeroes = group.pools.flatMap((pool) => derivedPools[pool]);

            if (visibleHeroes.length === 0) {
              return null;
            }

            return (
              <section
                key={group.label}
                className="border-t border-white/10 pt-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] first:border-t-0 first:pt-0 first:shadow-none lg:border-l lg:border-t-0 lg:px-3 lg:pt-0 lg:shadow-[inset_1px_0_0_rgba(255,255,255,0.05)] lg:[border-left-color:rgba(255,255,255,0.10)] lg:first:border-l-0 lg:first:pl-0 lg:first:shadow-none lg:last:pr-0"
              >
                <div className="grid gap-1.5">
                  <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-zinc-100">
                    {COMPETITIVE_ROLE_LABELS[groupRole]}
                  </h3>
                  {roleStatus ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold ${roleStatusClassName[roleStatus]}`}
                      >
                        {roleStatus}
                      </span>
                      {roleProfile ? (
                        <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-3 text-[11px] font-semibold text-zinc-200">
                          {rankIconSrc ? (
                            <span className="relative h-4 w-4 shrink-0">
                              <Image
                                src={rankIconSrc}
                                alt={`${roleProfile.rankTier} rank icon`}
                                fill
                                className="object-contain"
                                sizes="16px"
                              />
                            </span>
                          ) : null}
                          {formatCurrentRank(
                            roleProfile.rankTier,
                            roleProfile.rankDivision
                          )}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="mt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {visibleHeroes.map((hero) => (
                      <div
                        key={hero.id}
                        title={hero.label}
                        className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-zinc-900 sm:h-10 sm:w-10"
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
