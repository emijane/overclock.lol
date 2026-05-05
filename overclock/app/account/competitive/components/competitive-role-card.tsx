import Image from "next/image";
import { PencilIcon } from "lucide-react";

import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import type {
  CompetitiveRole,
  CompetitiveRoleProfile,
} from "@/lib/competitive/competitive-profile-types";
import { getRankIconSrc } from "@/lib/competitive/rank-icons";
import { HERO_ROSTER } from "@/lib/heroes/hero-roster";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";

type CompetitiveRoleCardProps = {
  heroIds: string[];
  isMainRole: boolean;
  onSelectRole: (role: CompetitiveRole) => void;
  role: CompetitiveRole;
  roleProfile: CompetitiveRoleProfile | null;
};

export function CompetitiveRoleCard({
  heroIds,
  isMainRole,
  onSelectRole,
  role,
  roleProfile,
}: CompetitiveRoleCardProps) {
  const isConfigured = Boolean(roleProfile);
  const heroes = heroIds
    .map((heroId) => HERO_ROSTER.find((hero) => hero.id === heroId))
    .filter((hero): hero is (typeof HERO_ROSTER)[number] => Boolean(hero));
  const rankIconSrc = roleProfile ? getRankIconSrc(roleProfile.rankTier) : null;

  return (
    <article className="group flex h-full flex-col rounded-[16px] border border-white/10 bg-[#05070b] p-3 transition-all duration-200 hover:bg-[#080b10]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-zinc-100">
              {COMPETITIVE_ROLE_LABELS[role]}
            </h2>
            {isMainRole ? (
              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/50">
                Main role
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 flex min-h-4 items-center gap-1 text-[10px] font-medium text-white/65">
            {rankIconSrc && roleProfile ? (
              <span className="relative h-3 w-3 shrink-0">
                <Image
                  src={rankIconSrc}
                  alt={`${roleProfile.rankTier} rank icon`}
                  fill
                  className="object-contain"
                  sizes="12px"
                />
              </span>
            ) : null}
            <span className={roleProfile ? "text-white/65" : "text-zinc-600"}>
              {roleProfile
                ? formatCurrentRank(roleProfile.rankTier, roleProfile.rankDivision)
                : "Not set"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelectRole(role)}
          aria-label={
            isConfigured
              ? `Edit ${COMPETITIVE_ROLE_LABELS[role]}`
              : `Set up ${COMPETITIVE_ROLE_LABELS[role]}`
          }
          title={isConfigured ? "Edit role" : "Set up role"}
          className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-100 backdrop-blur-md transition-all duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
        >
          <PencilIcon className="h-3 w-3" />
        </button>
      </div>

      <div className="mt-2 min-h-8">
        {heroes.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {heroes.map((hero) => (
              <div
                key={hero.id}
                title={hero.label}
                className="relative h-7 w-7 shrink-0 overflow-hidden rounded-[8px] bg-zinc-900"
              >
                <Image
                  src={hero.imageSrc}
                  alt={hero.label}
                  fill
                  className="object-cover"
                  sizes="28px"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="pt-0.5 text-sm font-medium text-zinc-600">
            No heroes selected
          </p>
        )}
      </div>
    </article>
  );
}
