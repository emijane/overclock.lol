import { CompetitiveRoleCard } from "@/app/account/competitive/components/competitive-role-card";
import {
  COMPETITIVE_ROLE_OPTIONS,
  type CompetitiveProfile,
  type CompetitiveRole,
} from "@/lib/competitive/competitive-profile";

type CompetitiveRoleCardListProps = {
  competitiveProfile: CompetitiveProfile;
};

export function CompetitiveRoleCardList({
  competitiveProfile,
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
            role={role}
            roleProfile={roleProfileByRole.get(role) ?? null}
          />
        ))}
      </div>
    </section>
  );
}
