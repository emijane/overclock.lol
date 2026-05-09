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
    <div className="grid gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-zinc-300">Heroes</p>
        <div className="flex items-center gap-3">
          <p className="text-xs text-zinc-500">
            {selectedHeroIds.length}/{HERO_LIMIT}
          </p>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={selectedHeroIds.length === 0}
            className="cursor-pointer text-xs font-medium text-zinc-400 transition hover:text-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-600"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
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
              className={`flex h-[52px] cursor-pointer items-center gap-2 rounded-[14px] border px-2 py-2 text-left transition ${
                isSelected
                  ? "border-[#B8B8C0]/30 bg-[#B8B8C0]/[0.12] text-zinc-50"
                  : "border-white/10 bg-[#B8B8C0]/[0.08] text-zinc-300 hover:border-white/20 hover:bg-[#B8B8C0]/[0.12] hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
              }`}
            >
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-[8px] bg-zinc-900">
                <Image
                  src={hero.imageSrc}
                  alt={hero.label}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
              <span className="text-xs font-medium">{hero.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
