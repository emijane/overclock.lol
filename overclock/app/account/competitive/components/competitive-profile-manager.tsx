"use client";

import { useState } from "react";

import { CompetitiveRoleCardList } from "@/app/account/competitive/components/competitive-role-card-list";
import { CompetitiveRoleEditorShell } from "@/app/account/competitive/components/competitive-role-editor-shell";
import type {
  CompetitiveProfile,
  CompetitiveRole,
} from "@/lib/competitive/competitive-profile-types";
import type { HeroPoolSelections } from "@/lib/heroes/profile-hero-pools";

type CompetitiveProfileManagerProps = {
  competitiveProfile: CompetitiveProfile;
  heroSelections: HeroPoolSelections;
};

export function CompetitiveProfileManager({
  competitiveProfile,
  heroSelections,
}: CompetitiveProfileManagerProps) {
  const [selectedRole, setSelectedRole] = useState<CompetitiveRole | null>(null);

  return (
    <>
      <CompetitiveRoleCardList
        competitiveProfile={competitiveProfile}
        heroSelections={heroSelections}
        onSelectRole={setSelectedRole}
      />

      {selectedRole ? (
        <CompetitiveRoleEditorShell
          onCancel={() => setSelectedRole(null)}
          role={selectedRole}
        />
      ) : null}
    </>
  );
}
