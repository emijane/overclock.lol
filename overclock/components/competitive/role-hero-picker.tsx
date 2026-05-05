"use client";

import Image from "next/image";

import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import { HERO_ROSTER } from "@/lib/heroes/hero-roster";

const HERO_LIMIT = 5;

type RoleHeroPickerProps = {
  onChange: (heroIds: string[]) => void;
  role: CompetitiveRole;
  selectedHeroIds: string[];
};

function getHeroesForRole(role: CompetitiveRole) {
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

export function RoleHeroPicker({
  onChange,
  role,
  selectedHeroIds,
}: RoleHeroPickerProps) {
  const heroes = getHeroesForRole(role);

  function toggleHero(heroId: string) {
    if (selectedHeroIds.includes(heroId)) {
      onChange(selectedHeroIds.filter((selectedHeroId) => selectedHeroId !== heroId));
      return;
    }

    if (selectedHeroIds.length >= HERO_LIMIT) {
      return;
    }

    onChange([...selectedHeroIds, heroId]);
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-300">Choose up to five heroes</p>
        <div className="flex items-center gap-3">
          <p className="text-sm text-zinc-500">
            {selectedHeroIds.length}/{HERO_LIMIT}
          </p>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={selectedHeroIds.length === 0}
            className="text-sm font-medium text-zinc-400 transition hover:text-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-600"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {heroes.map((hero) => {
          const isSelected = selectedHeroIds.includes(hero.id);
          const isDisabled = !isSelected && selectedHeroIds.length >= HERO_LIMIT;

          return (
            <button
              key={hero.id}
              type="button"
              onClick={() => toggleHero(hero.id)}
              disabled={isDisabled}
              aria-pressed={isSelected}
              className={`flex items-center gap-2.5 rounded-[16px] border px-2.5 py-2.5 text-left transition ${
                isSelected
                  ? "border-white/20 bg-white/[0.07] text-zinc-50"
                  : "border-white/10 bg-white/[0.035] text-zinc-300 hover:border-white/20 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
              }`}
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[10px] border border-white/10 bg-zinc-900">
                <Image
                  src={hero.imageSrc}
                  alt={hero.label}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
              <span className="text-sm font-medium">{hero.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
