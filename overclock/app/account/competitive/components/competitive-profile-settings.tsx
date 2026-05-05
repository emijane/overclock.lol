"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

import { saveCompetitiveProfileSettings } from "@/app/account/competitive/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [platform, setPlatform] = useState(selectedPlatform ?? "");

  return (
    <section className="border-t border-white/10 px-5 py-3 sm:px-6 sm:py-4">
      <form action={saveCompetitiveProfileSettings}>
        <input type="hidden" name="platform" value={platform} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-9 min-w-[92px] items-center justify-between gap-2 rounded-[16px] border border-white/10 bg-white/[0.035] px-3 text-left text-xs font-medium text-zinc-100 outline-none transition hover:border-white/20 focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400/30"
                >
                  <span>{platform || "Platform"}</span>
                  <ChevronDownIcon className="h-4 w-4 shrink-0 text-zinc-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="z-[120] w-[var(--radix-dropdown-menu-trigger-width)]"
              >
                <DropdownMenuItem onSelect={() => setPlatform("")}>
                  <span className="flex w-full items-center justify-between gap-3">
                    <span>Platform</span>
                    {!platform ? (
                      <CheckIcon className="h-4 w-4 text-sky-400" />
                    ) : null}
                  </span>
                </DropdownMenuItem>
                {PLATFORM_OPTIONS.map((platformOption) => (
                  <DropdownMenuItem
                    key={platformOption}
                    onSelect={() => setPlatform(platformOption)}
                  >
                    <span className="flex w-full items-center justify-between gap-3">
                      <span>{platformOption}</span>
                      {platform === platformOption ? (
                        <CheckIcon className="h-4 w-4 text-sky-400" />
                      ) : null}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
