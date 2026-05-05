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
      className="inline-flex h-8 items-center justify-center rounded-full border border-white/[0.14] bg-[#05070b] px-3 text-xs font-semibold text-zinc-100 transition-all duration-200 hover:border-white/[0.2] hover:bg-[#080b10] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:border-white/[0.08] disabled:bg-white/[0.03] disabled:text-zinc-600"
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
    <section className="border-t border-white/10 px-5 py-3 sm:px-6 sm:py-4">
      <form action={saveCompetitiveProfileSettings}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <label className="sr-only" htmlFor="competitive-platform">
              Platform
            </label>
            <select
              id="competitive-platform"
              name="platform"
              defaultValue={selectedPlatform ?? ""}
              className="h-9 min-w-[88px] rounded-[16px] border border-white/10 bg-white/[0.035] px-3 text-xs text-zinc-100 outline-none transition hover:border-white/20 focus:border-sky-400/60"
            >
              <option value="">Platform</option>
              {PLATFORM_OPTIONS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
            <span aria-hidden="true" className="text-zinc-600">
              •
            </span>
            <span>{configuredRoleCount} roles</span>
          </div>
          <SaveButton />
        </div>
      </form>
    </section>
  );
}
