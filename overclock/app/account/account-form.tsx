"use client";

import { useState } from "react";

import { updateProfile } from "@/app/account/actions";
import {
  LOOKING_FOR_OPTIONS,
  PLATFORM_OPTIONS,
  RANK_TIERS,
  REGION_OPTIONS,
  REGION_TO_TIMEZONES,
} from "@/lib/profiles/profile-options";

const RANK_DIVISIONS = [1, 2, 3, 4, 5] as const;

type AccountFormProps = {
  profile: {
    bio: string | null;
    current_rank_division: number | null;
    current_rank_tier: string | null;
    display_name: string;
    looking_for: string[] | null;
    peak_rank_division: number | null;
    peak_rank_tier: string | null;
    platform: string | null;
    region: string | null;
    timezone: string | null;
    username: string;
    uses_mic: boolean;
  };
};

function formatRank(
  tier: string | null | undefined,
  division: number | null | undefined
) {
  if (!tier) {
    return "Not set";
  }

  if (tier === "Unranked") {
    return "Unranked";
  }

  return `${tier} ${division ?? ""}`.trim();
}

export function AccountForm({ profile }: AccountFormProps) {
  const [region, setRegion] = useState(profile.region ?? "");
  const [timezone, setTimezone] = useState(profile.timezone ?? "");

  const timezoneOptions = region
    ? (REGION_TO_TIMEZONES[region as keyof typeof REGION_TO_TIMEZONES] ?? [])
    : [];

  function handleRegionChange(nextRegion: string) {
    setRegion(nextRegion);

    if (!nextRegion) {
      setTimezone("");
      return;
    }

    const nextTimezoneOptions =
      REGION_TO_TIMEZONES[nextRegion as keyof typeof REGION_TO_TIMEZONES] ?? [];

    if (!nextTimezoneOptions.includes(timezone)) {
      setTimezone("");
    }
  }

  return (
    <form action={updateProfile} className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Username
          </p>
          <p className="mt-2 text-sm font-medium text-slate-100">
            @{profile.username}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Display name
          </p>
          <p className="mt-2 text-sm font-medium text-slate-100">
            {profile.display_name}
          </p>
        </div>
      </div>

      <label className="grid gap-2 text-sm text-slate-300">
        Bio
        <textarea
          name="bio"
          rows={5}
          maxLength={1000}
          defaultValue={profile.bio ?? ""}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-400"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-sm text-slate-300">
          Region
          <select
            name="region"
            value={region}
            onChange={(event) => handleRegionChange(event.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-400"
          >
            <option value="">Not set</option>
            {REGION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm text-slate-300">
          Timezone
          <select
            name="timezone"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            disabled={!region}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">{region ? "Not set" : "Choose region first"}</option>
            {timezoneOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm text-slate-300">
          Platform
          <select
            name="platform"
            defaultValue={profile.platform ?? ""}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-400"
          >
            <option value="">Not set</option>
            {PLATFORM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-sm font-semibold text-white">Current rank</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-300">
              Tier
              <select
                name="current_rank_tier"
                defaultValue={profile.current_rank_tier ?? ""}
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-400"
              >
                <option value="">Not set</option>
                {RANK_TIERS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Division
              <select
                name="current_rank_division"
                defaultValue={profile.current_rank_division?.toString() ?? ""}
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-400"
              >
                <option value="">None</option>
                {RANK_DIVISIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-xs text-slate-500">
            Current value:{" "}
            {formatRank(profile.current_rank_tier, profile.current_rank_division)}
          </p>
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-sm font-semibold text-white">Peak rank</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-300">
              Tier
              <select
                name="peak_rank_tier"
                defaultValue={profile.peak_rank_tier ?? ""}
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-400"
              >
                <option value="">Not set</option>
                {RANK_TIERS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Division
              <select
                name="peak_rank_division"
                defaultValue={profile.peak_rank_division?.toString() ?? ""}
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-400"
              >
                <option value="">None</option>
                {RANK_DIVISIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-xs text-slate-500">
            Current value: {formatRank(profile.peak_rank_tier, profile.peak_rank_division)}
          </p>
        </div>
      </div>

      <fieldset className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <legend className="px-2 text-sm font-semibold text-white">
          Looking for
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {LOOKING_FOR_OPTIONS.map((option) => (
            <label
              key={option}
              className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200"
            >
              <input
                type="checkbox"
                name="looking_for"
                value={option}
                defaultChecked={profile.looking_for?.includes(option) ?? false}
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4 text-sm text-slate-200">
        <input
          type="checkbox"
          name="uses_mic"
          defaultChecked={profile.uses_mic}
        />
        I actively use voice comms
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
        >
          Save settings
        </button>
      </div>
    </form>
  );
}
