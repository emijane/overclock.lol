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
    <label className="grid gap-2 text-sm font-medium text-zinc-300">
      <span>{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={`inline-flex h-11 w-full items-center justify-between rounded-2xl border bg-white/[0.035] px-3.5 text-left text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none transition ${
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-zinc-50">
            {COMPETITIVE_ROLE_LABELS[role]}
          </h2>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-9 items-center rounded-full border border-white/[0.14] bg-[#05070b] px-3.5 text-sm font-semibold text-zinc-100 transition-all duration-200 hover:border-white/[0.2] hover:bg-[#080b10] hover:text-white"
        >
          Cancel
        </button>
      </div>

      {roleProfile ? (
        <form action={removeCompetitiveRoleProfile} className="mt-5">
          <input type="hidden" name="role" value={role} />
          <input
            type="hidden"
            name="was_main_role"
            value={isMainRole ? "true" : "false"}
          />
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-full border border-rose-400/30 bg-rose-950/20 px-3.5 text-sm font-semibold text-rose-100 transition hover:border-rose-300/50 hover:bg-rose-950/35"
          >
            Remove role
          </button>
        </form>
      ) : null}

      <div className="mt-4 grid gap-3">
        <div className="rounded-[18px] border border-white/10 bg-[#05070b] p-4 sm:p-5">
          <p className="text-sm font-medium text-zinc-200">{currentRankPreview}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-3 text-sm font-medium text-zinc-200">
              <button
                type="button"
                onClick={() => setMainRoleEnabled((current) => !current)}
                aria-pressed={mainRoleEnabled}
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                  mainRoleEnabled
                    ? "border-sky-400 bg-sky-400 text-zinc-950 shadow-[0_0_18px_rgba(56,189,248,0.24)]"
                    : "border-white/15 bg-white/[0.035] text-transparent hover:border-white/30"
                }`}
              >
                <CheckIcon className="h-3.5 w-3.5" />
              </button>
              Use as main competitive role
            </label>
          </div>
        </div>

        <div className="rounded-[18px] border border-white/10 bg-[#05070b] p-4 sm:p-5">
          <RoleHeroPicker
            onChange={setSelectedHeroIds}
            role={role}
            selectedHeroIds={selectedHeroIds}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-9 items-center rounded-full border border-white/[0.14] bg-[#05070b] px-3.5 text-sm font-semibold text-zinc-100 transition-all duration-200 hover:border-white/[0.2] hover:bg-[#080b10] hover:text-white"
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
            className="inline-flex h-9 items-center rounded-full border border-white/[0.14] bg-[#05070b] px-3.5 text-sm font-semibold text-zinc-100 transition-all duration-200 hover:border-white/[0.2] hover:bg-[#080b10] hover:text-white"
          >
            Save
          </button>
        </form>
      </div>
    </section>
  );
}
