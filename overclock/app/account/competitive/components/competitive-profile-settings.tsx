"use client";

import Link from "next/link";
import { PlusCircleIcon } from "lucide-react";
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
      className="inline-flex h-10 items-center justify-center rounded-full bg-sky-300/75 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300/90 active:bg-sky-400/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:bg-white/[0.055] disabled:text-zinc-600"
    >
      {pending ? "Saving..." : "Save Platform"}
    </button>
  );
}

export function CompetitiveProfileSettings({
  configuredRoleCount,
  selectedPlatform,
}: CompetitiveProfileSettingsProps) {
  return (
    <section className="border-t border-white/10 px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-6 sm:py-7">
      <form action={saveCompetitiveProfileSettings} className="grid gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-zinc-50">
                Competitive Settings
              </h2>
              <span className="inline-flex h-7 items-center rounded-full border border-white/10 bg-white/[0.035] px-2.5 text-[11px] font-semibold text-zinc-300">
                Playable Roles: {configuredRoleCount}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-6 text-zinc-400">
              Platform now lives with your competitive profile so your public rank
              card and LFG posts stay aligned.
            </p>
          </div>

          <Link
            href="/duos"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-sky-300/35 bg-sky-300/12 px-4 text-sm font-semibold text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition hover:border-sky-300/55 hover:bg-sky-300/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            <PlusCircleIcon className="h-4 w-4" />
            Create Post
          </Link>
        </div>

        <div className="grid gap-3 sm:max-w-sm">
          <label className="grid gap-1.5 text-sm text-zinc-300">
            <span className="font-medium text-zinc-100">Platform</span>
            <select
              name="platform"
              defaultValue={selectedPlatform ?? ""}
              className="h-11 rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 text-zinc-100 outline-none transition hover:border-zinc-700 focus:border-sky-400/60"
            >
              <option value="">Not set</option>
              {PLATFORM_OPTIONS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm leading-6 text-zinc-500">
            Used on your competitive profile and when creating LFG posts.
          </p>
        </div>

        <div>
          <SaveButton />
        </div>
      </form>
    </section>
  );
}
