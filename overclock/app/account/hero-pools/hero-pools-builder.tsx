"use client";

import Image from "next/image";
import { ShieldIcon, SwordsIcon, CrossIcon } from "lucide-react";
import { useState } from "react";

import { HERO_ROSTER } from "@/lib/heroes/hero-roster";

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
type HeroSelections = Record<RoleId, string[]>;
const HERO_LIMIT = 5;

const steps = [
  {
    number: "01",
    title: "Roles",
    description: "Choose the roles you play.",
  },
  {
    number: "02",
    title: "Heroes",
    description: "Pick up to five heroes for each role.",
  },
  {
    number: "03",
    title: "Preview",
    description: "Review the hero pools we build from your picks.",
  },
] as const;

export function HeroPoolsBuilder() {
  const [selectedRoles, setSelectedRoles] = useState<RoleId[]>([]);
  const [heroSelections, setHeroSelections] = useState<HeroSelections>({
    tank: [],
    dps: [],
    support: [],
  });

  function toggleRole(role: RoleId) {
    setSelectedRoles((current) =>
      current.includes(role)
        ? current.filter((value) => value !== role)
        : [...current, role]
    );
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

  return (
    <>
      <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
        <div className="grid gap-3 md:grid-cols-3">
          {steps.map((step) => (
            <section
              key={step.number}
              className="rounded-[22px] border border-zinc-800 bg-zinc-950/70 px-4 py-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                {step.number}
              </p>
              <h2 className="mt-2 text-sm font-semibold text-zinc-100">
                {step.title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                {step.description}
              </p>
            </section>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
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
    </>
  );
}
