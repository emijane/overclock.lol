"use client";

import { useState } from "react";

import { CompetitiveProfileSettings } from "@/app/account/competitive/components/competitive-profile-settings";
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
  const [selectedRole, setSelectedRole] = useState<CompetitiveRole | null>("tank");
  const selectedRoleProfile =
    competitiveProfile.roles.find((roleProfile) => roleProfile.role === selectedRole) ??
    null;

  return (
    <>
      <CompetitiveProfileSettings
        configuredRoleCount={competitiveProfile.roles.length}
        selectedPlatform={competitiveProfile.platform}
      />

      <CompetitiveRoleCardList
        competitiveProfile={competitiveProfile}
        heroSelections={heroSelections}
        onSelectRole={setSelectedRole}
      />

      {selectedRole ? (
        <CompetitiveRoleEditorShell
          key={selectedRole}
          heroIds={heroSelections[selectedRole]}
          isMainRole={competitiveProfile.mainRole === selectedRole}
          onCancel={() => setSelectedRole(null)}
          role={selectedRole}
          roleProfile={selectedRoleProfile}
        />
      ) : null}
    </>
  );
}
