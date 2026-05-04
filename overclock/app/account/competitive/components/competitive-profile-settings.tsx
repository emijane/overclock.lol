"use client";

import { useFormStatus } from "react-dom";

import { saveCompetitiveProfileSettings } from "@/app/account/competitive/actions";
import type { CompetitivePlatform } from "@/lib/competitive/competitive-profile-types";
import { PLATFORM_OPTIONS } from "@/lib/profiles/profile-options";

type CompetitiveProfileSettingsProps = {
  configuredRoleCount: number;
  selectedPlatform: CompetitivePlatform | null;
};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center justify-center rounded-full border border-white/[0.14] bg-[#05070b] px-3.5 text-sm font-semibold text-zinc-100 transition-all duration-200 hover:border-white/[0.2] hover:bg-[#080b10] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:border-white/[0.08] disabled:bg-white/[0.03] disabled:text-zinc-600"
    >
      {pending ? "Saving..." : "Save"}
    </button>
  );
}

export function CompetitiveProfileSettings({
  configuredRoleCount,
  selectedPlatform,
}: CompetitiveProfileSettingsProps) {
  return (
    <section className="border-t border-white/10 px-5 py-5 sm:px-6 sm:py-6">
      <form
        action={saveCompetitiveProfileSettings}
        className="rounded-[18px] border border-white/[0.07] bg-[#05070b] px-4 py-4 shadow-[0_16px_36px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.04)]"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-3 sm:min-w-[17rem]">
            <span className="inline-flex h-7 w-fit items-center rounded-full border border-white/10 bg-white/[0.05] px-2.5 text-[11px] font-medium text-zinc-300">
              Roles: {configuredRoleCount}
            </span>
            <label className="grid gap-1.5 text-sm text-zinc-300">
              <span className="font-medium text-zinc-100">Platform</span>
              <select
                name="platform"
                defaultValue={selectedPlatform ?? ""}
                className="h-11 rounded-2xl border border-white/10 bg-white/[0.035] px-3.5 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none transition hover:border-white/20 focus:border-sky-400/60"
              >
                <option value="">Not set</option>
                {PLATFORM_OPTIONS.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex justify-start sm:justify-end">
            <SaveButton />
          </div>
        </div>
      </form>
    </section>
  );
}
