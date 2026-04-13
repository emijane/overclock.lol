"use client";

import Image from "next/image";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
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
    description: "Build your tank pool with the heroes you trust in ranked.",
  },
  {
    id: "dps",
    label: "DPS",
    description: "Pick the damage heroes you actually want to queue on.",
  },
  {
    id: "support",
    label: "Support",
    description: "Choose the support heroes you feel strongest playing.",
  },
] as const;

const STEP_META = [
  ...ROLE_OPTIONS.map((role, index) => ({
    number: `${index + 1}`,
    title: role.label,
  })),
  {
    number: "4",
    title: "Preview",
  },
] as const;

type RoleId = (typeof ROLE_OPTIONS)[number]["id"];
type HeroPoolsBuilderProps = {
  initialRoles: HeroPoolRoleOption[];
  initialHeroSelections: HeroPoolSelections;
};

const HERO_LIMIT = 5;

export function HeroPoolsBuilder({
  initialRoles,
  initialHeroSelections,
}: HeroPoolsBuilderProps) {
  const [selectedRoles, setSelectedRoles] = useState<RoleId[]>(initialRoles);
  const [heroSelections, setHeroSelections] = useState<HeroPoolSelections>(
    initialHeroSelections
  );
  const [currentStep, setCurrentStep] = useState(0);

  const isPreviewStep = currentStep === ROLE_OPTIONS.length;
  const currentRole = !isPreviewStep ? ROLE_OPTIONS[currentStep] : null;
  const currentRoleId = currentRole?.id ?? null;
  const currentRoleHeroes = currentRoleId ? heroSelections[currentRoleId] : [];
  const canMoveNext = isPreviewStep || currentRoleHeroes.length > 0;

  function setRoleEnabled(role: RoleId, enabled: boolean) {
    setSelectedRoles((current) => {
      if (enabled) {
        return current.includes(role) ? current : [...current, role];
      }

      return current.filter((value) => value !== role);
    });

    if (!enabled) {
      setHeroSelections((current) => ({
        ...current,
        [role]: [],
      }));
    }
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

  function goToNextStep(options?: { allowEmpty?: boolean }) {
    if (!options?.allowEmpty && !canMoveNext) {
      return;
    }

    setCurrentStep((current) => Math.min(current + 1, ROLE_OPTIONS.length));
  }

  function goToPreviousStep() {
    setCurrentStep((current) => Math.max(current - 1, 0));
  }

  function clearRole(role: RoleId) {
    setRoleEnabled(role, false);
  }

  function skipRole(role: RoleId) {
    clearRole(role);
    goToNextStep({ allowEmpty: true });
  }

  const normalizedSelectedRoles = ROLE_OPTIONS.map((role) => role.id).filter((role) =>
    selectedRoles.includes(role)
  );

  const selectedHeroes = normalizedSelectedRoles.flatMap((role) =>
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
      <input
        type="hidden"
        name="roles"
        value={JSON.stringify(normalizedSelectedRoles)}
      />
      <input
        type="hidden"
        name="hero_picks"
        value={JSON.stringify(heroSelections)}
      />

      <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-4">
          {STEP_META.map((step, index) => {
            const isActive = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <button
                key={step.number}
                type="button"
                onClick={() => {
                  if (index <= currentStep) {
                    setCurrentStep(index);
                  }
                }}
                className={`rounded-[22px] border px-4 py-4 text-left transition ${
                  isActive
                    ? "border-sky-400 bg-sky-400/10"
                    : isComplete
                      ? "border-zinc-700 bg-zinc-950/70"
                      : "border-zinc-800 bg-zinc-950/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold ${
                      isActive
                        ? "border-sky-400 bg-sky-400 text-zinc-950"
                        : isComplete
                          ? "border-zinc-600 bg-zinc-800 text-zinc-100"
                          : "border-zinc-700 bg-zinc-900 text-zinc-500"
                    }`}
                  >
                    {isComplete ? <CheckIcon className="h-4 w-4" /> : step.number}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-100">
                      {step.title}
                    </p>
                    {index < ROLE_OPTIONS.length ? (
                      <p className="text-xs text-zinc-500">
                        {heroSelections[ROLE_OPTIONS[index].id].length} selected
                      </p>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {!isPreviewStep && currentRoleId ? (
        <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-zinc-50">
                {currentRole?.label} hero pool
              </h2>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                {currentRole?.description}
              </p>
            </div>
          </div>

          <div className="rounded-[22px] border border-zinc-800 bg-zinc-950/70 px-4 py-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-100">
                Choose up to five heroes
              </h3>
              <div className="flex items-center gap-3">
                <p className="text-sm text-zinc-500">
                  {currentRoleHeroes.length}/{HERO_LIMIT}
                </p>
                <button
                  type="button"
                  onClick={() => clearRole(currentRoleId)}
                  disabled={currentRoleHeroes.length === 0}
                  className="text-sm font-medium text-zinc-400 transition hover:text-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-600"
                >
                  Clear all
                </button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {getHeroesForRole(currentRoleId).map((hero) => {
                const isSelected = currentRoleHeroes.includes(hero.id);
                const isDisabled =
                  !isSelected && currentRoleHeroes.length >= HERO_LIMIT;

                return (
                  <button
                    key={hero.id}
                    type="button"
                    onClick={() => {
                      setRoleEnabled(currentRoleId, true);
                      toggleHero(currentRoleId, hero.id);
                    }}
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

          </div>

          <div className="mt-5 flex flex-wrap justify-between gap-3">
            <button
              type="button"
              onClick={goToPreviousStep}
              disabled={currentStep === 0}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Back
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  skipRole(currentRoleId);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
              >
                Skip
              </button>

              <button
                type="button"
                onClick={() => goToNextStep()}
                disabled={!canMoveNext}
                className="inline-flex items-center gap-2 rounded-full bg-sky-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-zinc-50">
                Preview your hero pools
              </h2>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                Review the roles you kept and the heroes that will show on your profile.
              </p>
            </div>
            <p className="text-sm text-zinc-500">
              {normalizedSelectedRoles.length} role
              {normalizedSelectedRoles.length === 1 ? "" : "s"} selected
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
              You skipped every role, so no hero pools will be shown on your profile yet.
            </div>
          )}

          <div className="mt-5 flex flex-wrap justify-between gap-3">
            <button
              type="button"
              onClick={goToPreviousStep}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Back
            </button>

            <button
              type="submit"
              className="rounded-full bg-sky-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300"
            >
              Save hero pools
            </button>
          </div>
        </section>
      )}
    </form>
  );
}
