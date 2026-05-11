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
  "Main role": "text-white/50",
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
    <section className="border-t border-white/[0.04] px-5 pb-4 pt-3 sm:px-6 sm:pb-5 sm:pt-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="oc-profile-meta text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
            Competitive Roles
          </h2>
        </div>

        {isOwner ? (
          <Link
            href="/account/competitive"
            aria-label="Edit competitive roles"
            title="Edit competitive roles"
            className="oc-profile-icon-button inline-flex h-7 w-7 shrink-0 items-center justify-center text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>

      {selectedHeroes.length === 0 ? (
        <div className="mt-3 rounded-[10px] border border-white/[0.04] bg-white/[0.015] px-4 py-3 text-sm text-zinc-500">
          Add your main roles and comfort heroes to show them here.
        </div>
      ) : (
        <div className="mt-3 grid gap-2.5 lg:grid-cols-3">
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
                className="rounded-[10px] border border-white/[0.07] bg-white/[0.025] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_10px_22px_rgba(0,0,0,0.18)] transition-[border-color,background-color,transform] duration-150 hover:-translate-y-px hover:border-white/[0.11] hover:bg-white/[0.035]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="oc-profile-display text-[15px] font-semibold tracking-[-0.02em] text-zinc-100">
                        {COMPETITIVE_ROLE_LABELS[groupRole]}
                      </h3>
                      {roleStatus ? (
                        <span
                          className={`oc-profile-meta text-[10px] font-medium uppercase tracking-[0.12em] ${roleStatusClassName[roleStatus]}`}
                        >
                          {roleStatus}
                        </span>
                      ) : null}
                    </div>
                    {roleProfile ? (
                      <div className="oc-profile-meta mt-1 flex items-center gap-1.5 text-[11px] font-medium text-white/65">
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
                </div>

                <div className="mt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {visibleHeroes.map((hero) => (
                      <div
                        key={hero.id}
                        title={hero.label}
                        className="relative h-8 w-8 shrink-0 overflow-hidden rounded-[10px] border border-white/[0.06] bg-zinc-950"
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
