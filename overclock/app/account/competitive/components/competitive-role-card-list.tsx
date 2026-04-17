import { CompetitiveRoleCard } from "@/app/account/competitive/components/competitive-role-card";
import {
  COMPETITIVE_ROLE_OPTIONS,
  type CompetitiveProfile,
  type CompetitiveRole,
} from "@/lib/competitive/competitive-profile";
import type { HeroPoolSelections } from "@/lib/heroes/profile-hero-pools";

type CompetitiveRoleCardListProps = {
  competitiveProfile: CompetitiveProfile;
  heroSelections: HeroPoolSelections;
};

export function CompetitiveRoleCardList({
  competitiveProfile,
  heroSelections,
}: CompetitiveRoleCardListProps) {
  const roleProfileByRole = new Map(
    competitiveProfile.roles.map((roleProfile) => [
      roleProfile.role,
      roleProfile,
    ])
  );

  return (
    <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {COMPETITIVE_ROLE_OPTIONS.map((role: CompetitiveRole) => (
          <CompetitiveRoleCard
            key={role}
            isMainRole={competitiveProfile.mainRole === role}
            heroIds={heroSelections[role]}
            role={role}
            roleProfile={roleProfileByRole.get(role) ?? null}
          />
        ))}
      </div>
    </section>
  );
}
