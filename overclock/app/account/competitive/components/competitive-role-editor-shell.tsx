import { useState } from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

import {
  removeCompetitiveRoleProfile,
  saveCompetitiveRoleProfile,
} from "@/app/account/competitive/actions";
import { RoleHeroPicker } from "@/components/competitive/role-hero-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

function EditorDropdownField({
  disabled = false,
  label,
  onSelect,
  options,
  placeholder,
  value,
}: {
  disabled?: boolean;
  label: string;
  onSelect: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  value: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-zinc-300">
      <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={`inline-flex h-10 w-full items-center justify-between rounded-2xl border bg-white/[0.035] px-3 text-left text-sm outline-none transition ${
              disabled
                ? "cursor-not-allowed border-white/10 text-zinc-600 opacity-70"
                : "border-white/10 text-zinc-100 hover:border-white/20 focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400/30"
            }`}
          >
            <span className={value ? "text-zinc-100" : "text-zinc-500"}>
              {value || placeholder}
            </span>
            <ChevronDownIcon className="h-4 w-4 shrink-0 text-zinc-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="z-[120] w-[var(--radix-dropdown-menu-trigger-width)]"
        >
          <DropdownMenuItem onSelect={() => onSelect("")}>
            <span className="flex w-full items-center justify-between gap-3">
              <span>{placeholder}</span>
              {!value ? <CheckIcon className="h-4 w-4 text-sky-400" /> : null}
            </span>
          </DropdownMenuItem>
          {options.map((option) => (
            <DropdownMenuItem key={option} onSelect={() => onSelect(option)}>
              <span className="flex w-full items-center justify-between gap-3">
                <span>{option}</span>
                {value === option ? (
                  <CheckIcon className="h-4 w-4 text-sky-400" />
                ) : null}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </label>
  );
}

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

  return (
    <section className="border-t border-white/10 px-5 py-4 sm:px-6 sm:py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-zinc-50">
          {COMPETITIVE_ROLE_LABELS[role]}
        </h2>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-8 items-center rounded-full border border-white/[0.14] bg-[#05070b] px-3 text-xs font-semibold text-zinc-100 transition-all duration-200 hover:border-white/[0.2] hover:bg-[#080b10] hover:text-white"
        >
          Cancel
        </button>
      </div>

      {roleProfile ? (
        <form action={removeCompetitiveRoleProfile} className="mt-3">
          <input type="hidden" name="role" value={role} />
          <input
            type="hidden"
            name="was_main_role"
            value={isMainRole ? "true" : "false"}
          />
          <button
            type="submit"
            className="inline-flex h-8 items-center rounded-full border border-white/12 bg-transparent px-3 text-xs font-semibold text-zinc-400 transition hover:border-rose-300/35 hover:text-rose-200"
          >
            Remove role
          </button>
        </form>
      ) : null}

      <div className="mt-4 space-y-4">
        <div className="border-t border-white/10 pt-4">
          <p className="text-sm font-medium text-zinc-200">{currentRankPreview}</p>

          <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
            <EditorDropdownField
              label="Tier"
              value={selectedRankTier}
              placeholder="Select tier"
              options={RANK_TIERS}
              onSelect={(value) =>
                handleRankTierChange(value as CompetitiveRankTier)
              }
            />

            <EditorDropdownField
              disabled={selectedRankTier === "Unranked"}
              label="Division"
              value={selectedRankDivision}
              placeholder={
                selectedRankTier === "Unranked" ? "No division" : "Choose division"
              }
              options={RANK_DIVISION_OPTIONS}
              onSelect={setSelectedRankDivision}
            />

            <label className="flex h-10 items-center gap-2 text-sm font-medium text-zinc-200 sm:justify-end">
              <button
                type="button"
                onClick={() => setMainRoleEnabled((current) => !current)}
                aria-pressed={mainRoleEnabled}
                className={`inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition ${
                  mainRoleEnabled
                    ? "border-sky-400 bg-sky-400 text-zinc-950"
                    : "border-white/15 bg-white/[0.035] text-transparent hover:border-white/30"
                }`}
              >
                <CheckIcon className="h-3 w-3" />
              </button>
              Main role
            </label>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4">
          <RoleHeroPicker
            onChange={setSelectedHeroIds}
            role={role}
            selectedHeroIds={selectedHeroIds}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-8 items-center rounded-full border border-white/[0.14] bg-[#05070b] px-3 text-xs font-semibold text-zinc-100 transition-all duration-200 hover:border-white/[0.2] hover:bg-[#080b10] hover:text-white"
        >
          Cancel
        </button>

        <form action={saveCompetitiveRoleProfile}>
          <input type="hidden" name="role" value={role} />
          <input
            type="hidden"
            name="was_main_role"
            value={isMainRole ? "true" : "false"}
          />
          <input type="hidden" name="rank_tier" value={selectedRankTier} />
          <input
            type="hidden"
            name="rank_division"
            value={selectedRankDivision}
          />
          <input
            type="hidden"
            name="hero_ids"
            value={JSON.stringify(selectedHeroIds)}
          />
          {mainRoleEnabled ? (
            <input type="hidden" name="main_role" value="on" />
          ) : null}

          <button
            type="submit"
            className="inline-flex h-8 items-center rounded-full border border-white/[0.14] bg-[#05070b] px-3 text-xs font-semibold text-zinc-100 transition-all duration-200 hover:border-white/[0.2] hover:bg-[#080b10] hover:text-white"
          >
            Save
          </button>
        </form>
      </div>
    </section>
  );
}
