import {
  COMPETITIVE_ROLE_LABELS,
} from "@/lib/competitive/competitive-role-labels";
import type {
  CompetitiveRole,
  CompetitiveRoleProfile,
} from "@/lib/competitive/competitive-profile";

type CompetitiveRoleCardProps = {
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
  isMainRole,
  role,
  roleProfile,
}: CompetitiveRoleCardProps) {
  const isConfigured = Boolean(roleProfile);
  const statusLabel = isMainRole ? "Main role" : isConfigured ? "Off-role" : "Not set up";

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
    </article>
  );
}
