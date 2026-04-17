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
            className={`inline-flex h-11 w-full items-center justify-between rounded-2xl border bg-zinc-950 px-3.5 text-left text-sm outline-none transition ${
              disabled
                ? "cursor-not-allowed border-zinc-800 text-zinc-600 opacity-70"
                : "border-zinc-800 text-zinc-100 hover:border-zinc-700 focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400/30"
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
            className="rounded-full border border-rose-400/40 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:border-rose-300/60 hover:bg-rose-950/30 hover:text-rose-100"
          >
            Remove {COMPETITIVE_ROLE_LABELS[role]} profile
          </button>
        </form>
      ) : null}

      <div className="mt-5 grid gap-4">
        <div className="rounded-[22px] border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                Rank
              </p>
              <p className="mt-2 text-sm font-medium text-zinc-200">
                {currentRankPreview}
              </p>
            </div>
          </div>

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
                selectedRankTier === "Unranked"
                  ? "No division"
                  : "Choose division"
              }
              options={RANK_DIVISION_OPTIONS}
              onSelect={setSelectedRankDivision}
            />
          </div>

          <div className="mt-5">
            <label className="flex items-center gap-3 text-sm font-medium text-zinc-200">
              <button
                type="button"
                onClick={() => setMainRoleEnabled((current) => !current)}
                aria-pressed={mainRoleEnabled}
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                  mainRoleEnabled
                    ? "border-sky-400 bg-sky-400 text-zinc-950 shadow-[0_0_18px_rgba(56,189,248,0.24)]"
                    : "border-zinc-700 bg-zinc-950 text-transparent hover:border-zinc-500"
                }`}
              >
                <CheckIcon className="h-3.5 w-3.5" />
              </button>
              Use as main competitive role
            </label>
            <p className="mt-2 pl-7 text-xs leading-5 text-zinc-500">
              You can only have one main role. Choosing this will replace your
              current main role.
            </p>
          </div>
        </div>

        <div className="rounded-[22px] border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5">
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
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-950 hover:text-zinc-50"
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
            className="rounded-full bg-sky-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300"
          >
            Save role
          </button>
        </form>
      </div>
    </section>
  );
}
