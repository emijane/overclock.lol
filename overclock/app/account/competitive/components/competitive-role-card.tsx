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
    <article className="group flex h-full flex-col rounded-[16px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.018)_0%,rgba(255,255,255,0.008)_100%)] p-3 transition-all duration-200 hover:border-white/[0.12] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.026)_0%,rgba(255,255,255,0.012)_100%)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="font-mono text-[13px] font-semibold text-zinc-100">
              {COMPETITIVE_ROLE_LABELS[role]}
            </h2>
            {isMainRole ? (
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-white/50">
                Main role
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 flex min-h-4 items-center gap-1 font-mono text-[10px] font-medium text-white/65">
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
          className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-white/[0.08] bg-white/[0.05] text-zinc-100 backdrop-blur-md transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
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
                className="relative h-7 w-7 shrink-0 overflow-hidden rounded-[8px] bg-zinc-900 ring-1 ring-white/[0.06]"
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
          <p className="pt-0.5 font-mono text-[12px] font-medium text-zinc-600">
            No heroes selected
          </p>
        )}
      </div>
    </article>
  );
}
