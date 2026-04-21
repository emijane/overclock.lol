import Image from "next/image";

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
    const statusLabel = isMainRole
        ? "Main role"
        : isConfigured
            ? "Off-role"
            : "Not set up";
    const heroes = heroIds
        .map((heroId) => HERO_ROSTER.find((hero) => hero.id === heroId))
        .filter((hero): hero is (typeof HERO_ROSTER)[number] => Boolean(hero));
    const rankIconSrc = roleProfile ? getRankIconSrc(roleProfile.rankTier) : null;

    return (
        <article className="group flex h-full min-h-[272px] flex-col rounded-[22px] border border-white/10 bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-sky-300/20 hover:bg-white/[0.045] hover:shadow-[0_16px_42px_rgba(0,0,0,0.22),0_0_24px_rgba(56,189,248,0.08),inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-base font-semibold text-zinc-50">
                        {COMPETITIVE_ROLE_LABELS[role]}
                    </h2>
                    <p
                        className={`mt-1 text-sm ${
                            isConfigured ? "text-zinc-500" : "text-zinc-600"
                        }`}
                    >
                        {statusLabel}
                    </p>
                </div>

                {isMainRole ? (
                    <span className="mt-0.5 rounded-full border border-sky-300/35 bg-sky-300/10 px-3 py-1 text-xs font-semibold text-sky-100 shadow-[0_0_18px_rgba(56,189,248,0.12),inset_0_1px_0_rgba(255,255,255,0.08)]">
                        Main
                    </span>
                ) : null}
            </div>

            <div className="mt-4">
                <span
                    className={`inline-flex h-7 items-center rounded-full border px-2.5 text-[11px] font-semibold ${
                        isConfigured
                            ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                            : "border-white/10 bg-white/[0.025] text-zinc-500"
                    }`}
                >
                    Playable
                </span>
            </div>

            <div className="mt-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                    Rank
                </p>
                <div className="mt-1 flex min-h-6 items-center gap-2">
                    {rankIconSrc && roleProfile ? (
                        <Image
                            src={rankIconSrc}
                            alt={`${roleProfile.rankTier} rank icon`}
                            width={24}
                            height={24}
                            className="h-6 w-6 shrink-0 object-contain"
                        />
                    ) : null}
                    <p
                        className={`text-sm font-medium ${
                            roleProfile ? "text-zinc-200" : "text-zinc-600"
                        }`}
                    >
                        {roleProfile
                            ? formatCurrentRank(
                                  roleProfile.rankTier,
                                  roleProfile.rankDivision
                              )
                            : "Not listed"}
                    </p>
                </div>
            </div>

            <div className="mt-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                    Hero pool
                </p>
                <div className="mt-2 min-h-9">
                    {heroes.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {heroes.map((hero) => (
                                <div
                                    key={hero.id}
                                    className="flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-2.5 text-xs font-medium text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                                >
                                    <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-white/10 bg-zinc-900">
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
                        <p className="pt-0.5 text-sm font-medium text-zinc-600">
                            No heroes selected
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-auto pt-5">
                <button
                    type="button"
                    onClick={() => onSelectRole(role)}
                    className={`w-full rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-md transition-all duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${
                        isConfigured
                            ? "border-white/12 bg-white/[0.06] text-zinc-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_28px_rgba(0,0,0,0.14)] hover:border-sky-300/35 hover:bg-sky-300/10 hover:shadow-[0_0_24px_rgba(56,189,248,0.14),inset_0_1px_0_rgba(255,255,255,0.14)]"
                            : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/18 hover:bg-white/[0.055] hover:text-zinc-100"
                    }`}
                >
                    {isConfigured ? "Edit" : "Set up"}
                </button>
            </div>
        </article>
    );
}
