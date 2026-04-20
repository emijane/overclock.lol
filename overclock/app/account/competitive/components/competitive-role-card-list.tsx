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
        <section className="border-t border-white/10 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-6 sm:py-6">
            <p className="mb-4 text-sm font-semibold text-zinc-100">Role Setup</p>

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
