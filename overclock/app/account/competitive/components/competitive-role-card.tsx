import Image from "next/image";

import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import type {
  CompetitiveRole,
  CompetitiveRoleProfile,
} from "@/lib/competitive/competitive-profile";
import { HERO_ROSTER } from "@/lib/heroes/hero-roster";

type CompetitiveRoleCardProps = {
  heroIds: string[];
  isMainRole: boolean;
  role: CompetitiveRole;
  roleProfile: CompetitiveRoleProfile | null;
};

function getRankLabel(roleProfile: CompetitiveRoleProfile | null) {
  if (!roleProfile) {
    return "Not listed";
  }

  if (roleProfile.rankTier === "Unranked") {
    return "Unranked";
  }

  return `${roleProfile.rankTier} ${roleProfile.rankDivision ?? ""}`.trim();
}

export function CompetitiveRoleCard({
  heroIds,
  isMainRole,
  role,
  roleProfile,
}: CompetitiveRoleCardProps) {
  const isConfigured = Boolean(roleProfile);
  const statusLabel = isMainRole
    ? "Main role"
    : isConfigured
      ? "Off-role"
      : "Not set up";
  const heroes = heroIds
    .map((heroId) => HERO_ROSTER.find((hero) => hero.id === heroId))
    .filter((hero): hero is (typeof HERO_ROSTER)[number] => Boolean(hero));

  return (
    <article className="rounded-[22px] border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-50">
            {COMPETITIVE_ROLE_LABELS[role]}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">{statusLabel}</p>
        </div>

        {isMainRole ? (
          <span className="rounded-full border border-sky-400/40 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-200">
            Main
          </span>
        ) : null}
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
          Rank
        </p>
        <p className="mt-1 text-sm font-medium text-zinc-200">
          {getRankLabel(roleProfile)}
        </p>
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
          Hero pool
        </p>
        {heroes.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {heroes.map((hero) => (
              <div
                key={hero.id}
                className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-200"
              >
                <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950">
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
        ) : (
          <p className="mt-1 text-sm font-medium text-zinc-500">
            No heroes selected
          </p>
        )}
      </div>

      <div className="mt-5">
        <button
          type="button"
          className="w-full rounded-full border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900 hover:text-zinc-50"
        >
          {isConfigured ? "Edit" : "Set up"}
        </button>
      </div>
    </article>
  );
}
