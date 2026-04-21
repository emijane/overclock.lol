import { CompetitiveRoleCard } from "@/app/account/competitive/components/competitive-role-card";
import {
    COMPETITIVE_ROLE_OPTIONS,
    type CompetitiveProfile,
    type CompetitiveRole,
} from "@/lib/competitive/competitive-profile-types";
import type { HeroPoolSelections } from "@/lib/heroes/profile-hero-pools";

type CompetitiveRoleCardListProps = {
    competitiveProfile: CompetitiveProfile;
    heroSelections: HeroPoolSelections;
    onSelectRole: (role: CompetitiveRole) => void;
};

export function CompetitiveRoleCardList({
    competitiveProfile,
    heroSelections,
    onSelectRole,
}: CompetitiveRoleCardListProps) {
    const roleProfileByRole = new Map(
        competitiveProfile.roles.map((roleProfile) => [
            roleProfile.role,
            roleProfile,
        ])
    );

    return (
        <section className="border-t border-white/10 px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-6 sm:py-7">
            <div className="mb-5 max-w-2xl">
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-zinc-50">
                    Competitive Roles
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-zinc-400">
                    Select the roles, ranks, and hero pools you want available when creating posts.
                </p>
            </div>

            <div className="grid items-stretch gap-3 sm:grid-cols-3">
                {COMPETITIVE_ROLE_OPTIONS.map((role: CompetitiveRole) => (
                    <CompetitiveRoleCard
                        key={role}
                        isMainRole={competitiveProfile.mainRole === role}
                        heroIds={heroSelections[role]}
                        onSelectRole={onSelectRole}
                        role={role}
                        roleProfile={roleProfileByRole.get(role) ?? null}
                    />
                ))}
            </div>
        </section>
    );
}
