"use client";

import Image from "next/image";
import { ShieldIcon, SwordsIcon, CrossIcon } from "lucide-react";
import { useState } from "react";

import { saveHeroPools } from "@/app/account/hero-pools/actions";
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

const ROLE_OPTIONS = [
  {
    id: "tank",
    label: "Tank",
    Icon: ShieldIcon,
  },
  {
    id: "dps",
    label: "DPS",
    Icon: SwordsIcon,
  },
  {
    id: "support",
    label: "Support",
    Icon: CrossIcon,
  },
] as const;

type RoleId = (typeof ROLE_OPTIONS)[number]["id"];
const HERO_LIMIT = 5;

type HeroPoolsBuilderProps = {
  initialRoles: HeroPoolRoleOption[];
  initialHeroSelections: HeroPoolSelections;
};

export function HeroPoolsBuilder({
  initialRoles,
  initialHeroSelections,
}: HeroPoolsBuilderProps) {
  const [selectedRoles, setSelectedRoles] = useState<RoleId[]>(initialRoles);
  const [heroSelections, setHeroSelections] = useState<HeroPoolSelections>(
    initialHeroSelections
  );

  function toggleRole(role: RoleId) {
    setSelectedRoles((current) => {
      const isSelected = current.includes(role);

      if (isSelected) {
        setHeroSelections((heroCurrent) => ({
          ...heroCurrent,
          [role]: [],
        }));

        return current.filter((value) => value !== role);
      }

      return [...current, role];
    });
  }

  function toggleHero(role: RoleId, heroId: string) {
    setHeroSelections((current) => {
      const currentHeroes = current[role];
      const hasHero = currentHeroes.includes(heroId);

      if (hasHero) {
        return {
          ...current,
          [role]: currentHeroes.filter((value) => value !== heroId),
        };
      }

      if (currentHeroes.length >= HERO_LIMIT) {
        return current;
      }

      return {
        ...current,
        [role]: [...currentHeroes, heroId],
      };
    });
  }

  function getHeroesForRole(role: RoleId) {
    if (role === "tank") {
      return HERO_ROSTER.filter(
        (hero) => hero.pool === "main_tank" || hero.pool === "off_tank"
      );
    }

    if (role === "dps") {
      return HERO_ROSTER.filter(
        (hero) => hero.pool === "dps_hitscan" || hero.pool === "dps_flex"
      );
    }

    return HERO_ROSTER.filter(
      (hero) => hero.pool === "support_main" || hero.pool === "support_flex"
    );
  }

  const selectedHeroes = selectedRoles.flatMap((role) =>
    heroSelections[role]
      .map((heroId) => HERO_ROSTER.find((hero) => hero.id === heroId))
      .filter((hero): hero is HeroDefinition => Boolean(hero))
  );

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
    <form action={saveHeroPools} className="grid gap-4">
      <input type="hidden" name="roles" value={JSON.stringify(selectedRoles)} />
      <input
        type="hidden"
        name="hero_picks"
        value={JSON.stringify(heroSelections)}
      />

      <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            01
          </p>
          <h2 className="mt-2 text-base font-semibold text-zinc-100">Roles</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            Choose the roles you play.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {ROLE_OPTIONS.map((role) => {
            const isSelected = selectedRoles.includes(role.id);
            const { Icon } = role;

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => toggleRole(role.id)}
                aria-pressed={isSelected}
                className={`rounded-[22px] border px-4 py-5 text-left transition ${
                  isSelected
                    ? "border-sky-400 bg-sky-400/12 text-zinc-50"
                    : "border-zinc-800 bg-zinc-950/70 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
                }`}
              >
                <Icon className="h-5 w-5" />
                <p className="mt-4 text-base font-semibold">{role.label}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            02
          </p>
          <h2 className="mt-2 text-base font-semibold text-zinc-100">Heroes</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            Pick up to five heroes for each role.
          </p>
        </div>

        {selectedRoles.length > 0 ? (
          <div className="grid gap-4">
            {selectedRoles.map((role) => {
              const heroes = getHeroesForRole(role);
              const selected = heroSelections[role];
              const roleLabel =
                ROLE_OPTIONS.find((option) => option.id === role)?.label ?? role;

              return (
                <section
                  key={role}
                  className="rounded-[22px] border border-zinc-800 bg-zinc-950/70 px-4 py-4"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-zinc-100">
                      {roleLabel}
                    </h3>
                    <p className="text-sm text-zinc-500">
                      {selected.length}/{HERO_LIMIT}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {heroes.map((hero) => {
                      const isSelected = selected.includes(hero.id);
                      const isDisabled =
                        !isSelected && selected.length >= HERO_LIMIT;

                      return (
                        <button
                          key={hero.id}
                          type="button"
                          onClick={() => toggleHero(role, hero.id)}
                          disabled={isDisabled}
                          aria-pressed={isSelected}
                          className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                            isSelected
                              ? "border-sky-400 bg-sky-400/12 text-zinc-50"
                              : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                          }`}
                        >
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                            <Image
                              src={hero.imageSrc}
                              alt={hero.label}
                              fill
                              className="object-cover"
                              sizes="44px"
                            />
                          </div>
                          <span className="text-sm font-medium">{hero.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-zinc-800 bg-zinc-950/70 px-4 py-8 text-sm text-zinc-500">
            Choose at least one role to continue.
          </div>
        )}
      </section>

      <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            03
          </p>
          <h2 className="mt-2 text-base font-semibold text-zinc-100">Preview</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            Review the hero pools we build from your picks.
          </p>
        </div>

        {selectedHeroes.length > 0 ? (
          <div className="grid gap-4">
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
        ) : (
          <div className="rounded-[22px] border border-dashed border-zinc-800 bg-zinc-950/70 px-4 py-8 text-sm text-zinc-500">
            Your hero pool preview will appear here.
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-sky-400 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300"
        >
          Save
        </button>
      </div>
    </form>
  );
}
