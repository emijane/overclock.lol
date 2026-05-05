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
import { Switch } from "@/components/ui/switch";
import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import type {
  CompetitiveRankTier,
  CompetitiveRole,
  CompetitiveRoleProfile,
} from "@/lib/competitive/competitive-profile-types";
import { RANK_TIERS } from "@/lib/profiles/profile-options";
import { RANK_DIVISION_OPTIONS } from "@/lib/profiles/profile-editor";

function EditorDropdownField({
  disabled = false,
  onSelect,
  options,
  placeholder,
  value,
}: {
  disabled?: boolean;
  onSelect: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  value: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={`inline-flex h-9 w-full items-center justify-between rounded-[16px] border bg-white/[0.035] px-3 text-left text-xs outline-none transition ${
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

  return (
    <section className="border-t border-white/10 px-5 py-3 sm:px-6 sm:py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold tracking-[-0.03em] text-zinc-50">
          {COMPETITIVE_ROLE_LABELS[role]}
        </h2>

        <div className="flex items-center gap-2">
          <label className="inline-flex h-7 items-center gap-2 rounded-full border border-white/12 bg-white/[0.02] px-2.5 text-[11px] font-medium text-zinc-300">
            <span>Main role</span>
            <Switch
              checked={mainRoleEnabled}
              onCheckedChange={setMainRoleEnabled}
              className="h-5 w-9 border-white/12 bg-zinc-700 data-[state=checked]:bg-zinc-100"
            />
          </label>
          {roleProfile ? (
            <form action={removeCompetitiveRoleProfile}>
              <input type="hidden" name="role" value={role} />
              <input
                type="hidden"
                name="was_main_role"
                value={isMainRole ? "true" : "false"}
              />
              <button
                type="submit"
                className="inline-flex h-7 items-center rounded-full border border-white/12 bg-transparent px-2.5 text-[11px] font-semibold text-zinc-400 transition hover:border-rose-300/35 hover:text-rose-200"
              >
                Remove
              </button>
            </form>
          ) : null}
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-7 items-center rounded-full border border-white/[0.14] bg-[#05070b] px-2.5 text-[11px] font-semibold text-zinc-100 transition-all duration-200 hover:border-white/[0.2] hover:bg-[#080b10] hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        <div className="grid gap-2 sm:grid-cols-2 sm:items-center">
          <EditorDropdownField
            value={selectedRankTier}
            placeholder="Tier"
            options={RANK_TIERS}
            onSelect={(value) => handleRankTierChange(value as CompetitiveRankTier)}
          />

          <EditorDropdownField
            disabled={selectedRankTier === "Unranked"}
            value={selectedRankDivision}
            placeholder="Division"
            options={RANK_DIVISION_OPTIONS}
            onSelect={setSelectedRankDivision}
          />
        </div>

        <div>
          <RoleHeroPicker
            onChange={setSelectedHeroIds}
            role={role}
            selectedHeroIds={selectedHeroIds}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-7 items-center rounded-full border border-white/[0.14] bg-[#05070b] px-2.5 text-[11px] font-semibold text-zinc-100 transition-all duration-200 hover:border-white/[0.2] hover:bg-[#080b10] hover:text-white"
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
            className="inline-flex h-7 items-center rounded-full border border-white/[0.14] bg-[#05070b] px-2.5 text-[11px] font-semibold text-zinc-100 transition-all duration-200 hover:border-white/[0.2] hover:bg-[#080b10] hover:text-white"
          >
            Save
          </button>
        </form>
      </div>
    </section>
  );
}
