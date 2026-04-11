"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { FaComputerMouse } from "react-icons/fa6";
import { IoGameController } from "react-icons/io5";

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
    platform: string | null;
    region: string | null;
    timezone: string | null;
    username: string;
  };
};

type SectionProps = {
  title: string;
  description: string;
  children: ReactNode;
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

function AccountSection({ title, description, children }: SectionProps) {
  return (
    <section className="rounded-[24px] border border-zinc-800 bg-zinc-950/70">
      <div className="border-b border-zinc-800 px-5 py-4">
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-zinc-100">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-zinc-400">{description}</p>
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

export function AccountForm({ profile }: AccountFormProps) {
  const [region, setRegion] = useState(profile.region ?? "");
  const [timezone, setTimezone] = useState(profile.timezone ?? "");
  const [platform, setPlatform] = useState(profile.platform ?? "");

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
    <form action={updateProfile} className="grid gap-5">
      <AccountSection
        title="Identity"
        description="The profile basics people see first when they open your page."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              Username
            </p>
            <p className="mt-2 text-sm font-medium text-zinc-100">
              @{profile.username}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              Display name
            </p>
            <p className="mt-2 text-sm font-medium text-zinc-100">
              {profile.display_name}
            </p>
          </div>
        </div>

        <label className="mt-5 grid gap-2 text-sm text-zinc-300">
          Bio
          <textarea
            name="bio"
            rows={5}
            maxLength={1000}
            defaultValue={profile.bio ?? ""}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition focus:border-sky-400"
          />
        </label>
      </AccountSection>

      <AccountSection
        title="Play Preferences"
        description="Set the platform and queue context players should expect from you."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_1.1fr]">
          <label className="grid gap-2 text-sm text-zinc-300">
            Region
            <select
              name="region"
              value={region}
              onChange={(event) => handleRegionChange(event.target.value)}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition focus:border-sky-400"
            >
              <option value="">Not set</option>
              {REGION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm text-zinc-300">
            Timezone
            <select
              name="timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              disabled={!region}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition focus:border-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{region ? "Not set" : "Choose region first"}</option>
              {timezoneOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-2 text-sm text-zinc-300">
            <span>Platform</span>
            <input type="hidden" name="platform" value={platform} />
            <div className="grid grid-cols-2 gap-2">
              {PLATFORM_OPTIONS.map((option) => {
                const isSelected = platform === option;
                const Icon = option === "PC" ? FaComputerMouse : IoGameController;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setPlatform(option)}
                    aria-pressed={isSelected}
                    className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium outline-none transition ${
                      isSelected
                        ? "border-sky-400 bg-sky-400/12 text-zinc-50"
                        : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </AccountSection>

      <AccountSection
        title="Competitive Info"
        description="Keep your current rank up to date for players checking your profile."
      >
        <div className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-sm font-semibold text-zinc-100">Current rank</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-zinc-300">
              Tier
              <select
                name="current_rank_tier"
                defaultValue={profile.current_rank_tier ?? ""}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none transition focus:border-sky-400"
              >
                <option value="">Not set</option>
                {RANK_TIERS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-zinc-300">
              Division
              <select
                name="current_rank_division"
                defaultValue={profile.current_rank_division?.toString() ?? ""}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none transition focus:border-sky-400"
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
          <p className="text-xs text-zinc-500">
            Current value:{" "}
            {formatRank(profile.current_rank_tier, profile.current_rank_division)}
          </p>
        </div>
      </AccountSection>

      <AccountSection
        title="Looking For"
        description="Choose the kinds of queues and team setups you want to be discovered for."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {LOOKING_FOR_OPTIONS.map((option) => (
            <label
              key={option}
              className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200"
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
      </AccountSection>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-sky-400 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300"
        >
          Save settings
        </button>
      </div>
    </form>
  );
}
