import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { RoleHeroPicker } from "@/components/competitive/role-hero-picker";
import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import type {
  CompetitiveRankTier,
  CompetitiveRole,
  CompetitiveRoleProfile,
} from "@/lib/competitive/competitive-profile-types";
import { RANK_TIERS } from "@/lib/profiles/profile-options";
import {
  formatCurrentRank,
  RANK_DIVISION_OPTIONS,
} from "@/lib/profiles/profile-editor";

const EDITOR_STEPS = [
  {
    id: "rank",
    label: "Rank",
  },
  {
    id: "heroes",
    label: "Hero pool",
  },
] as const;

type CompetitiveRoleEditorShellProps = {
  heroIds: string[];
  isMainRole: boolean;
  onCancel: () => void;
  role: CompetitiveRole;
  roleProfile: CompetitiveRoleProfile | null;
};

export function CompetitiveRoleEditorShell({
  heroIds,
  isMainRole,
  onCancel,
  role,
  roleProfile,
}: CompetitiveRoleEditorShellProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedRankTier, setSelectedRankTier] =
    useState<CompetitiveRankTier>(roleProfile?.rankTier ?? "Unranked");
  const [selectedRankDivision, setSelectedRankDivision] = useState(
    roleProfile?.rankDivision?.toString() ?? ""
  );
  const [mainRoleEnabled, setMainRoleEnabled] = useState(isMainRole);
  const [selectedHeroIds, setSelectedHeroIds] = useState(heroIds);

  function handleRankTierChange(nextTier: CompetitiveRankTier) {
    setSelectedRankTier(nextTier);

    if (nextTier === "Unranked") {
      setSelectedRankDivision("");
      return;
    }

    if (!selectedRankDivision) {
      setSelectedRankDivision("5");
    }
  }

  const currentRankPreview = formatCurrentRank(
    selectedRankTier,
    selectedRankDivision
  );
  const currentStep = EDITOR_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === EDITOR_STEPS.length - 1;

  return (
    <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Role setup
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-zinc-50">
            {COMPETITIVE_ROLE_LABELS[role]}
          </h2>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-950 hover:text-zinc-50"
        >
          Cancel
        </button>
      </div>

      <div className="mt-5 rounded-[22px] border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5">
        {currentStep.id === "rank" ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
              Rank
            </p>
            <p className="mt-2 text-sm font-medium text-zinc-200">
              {currentRankPreview}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-zinc-300">
                <span>Tier</span>
                <select
                  value={selectedRankTier}
                  onChange={(event) =>
                    handleRankTierChange(
                      event.target.value as CompetitiveRankTier
                    )
                  }
                  className="h-11 rounded-2xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition focus:border-sky-400"
                >
                  {RANK_TIERS.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium text-zinc-300">
                <span>Division</span>
                <select
                  value={selectedRankDivision}
                  onChange={(event) => setSelectedRankDivision(event.target.value)}
                  disabled={selectedRankTier === "Unranked"}
                  className="h-11 rounded-2xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition focus:border-sky-400 disabled:cursor-not-allowed disabled:text-zinc-600"
                >
                  <option value="">
                    {selectedRankTier === "Unranked"
                      ? "No division"
                      : "Choose division"}
                  </option>
                  {RANK_DIVISION_OPTIONS.map((division) => (
                    <option key={division} value={division}>
                      {division}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm font-medium text-zinc-200">
              <input
                type="checkbox"
                checked={mainRoleEnabled}
                onChange={(event) => setMainRoleEnabled(event.target.checked)}
                className="h-4 w-4 accent-sky-400"
              />
              Use as main competitive role
            </label>
          </>
        ) : (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
              Hero pool
            </p>
            <div className="mt-4">
              <RoleHeroPicker
                onChange={setSelectedHeroIds}
                role={role}
                selectedHeroIds={selectedHeroIds}
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() =>
            setCurrentStepIndex((current) => Math.max(current - 1, 0))
          }
          disabled={isFirstStep}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-950 hover:text-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back
        </button>

        <button
          type="button"
          onClick={() =>
            setCurrentStepIndex((current) =>
              Math.min(current + 1, EDITOR_STEPS.length - 1)
            )
          }
          disabled={isLastStep}
          className="inline-flex items-center gap-2 rounded-full bg-sky-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          {currentStep.id === "rank" ? "Next: hero pool" : "Ready to save"}
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
