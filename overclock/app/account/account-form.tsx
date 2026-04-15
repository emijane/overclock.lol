"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { FaComputerMouse } from "react-icons/fa6";
import { IoGameController } from "react-icons/io5";

import { updateProfile } from "@/app/account/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LOOKING_FOR_OPTIONS,
  PLATFORM_OPTIONS,
  RANK_TIERS,
  REGION_OPTIONS,
  REGION_TO_TIMEZONES,
} from "@/lib/profiles/profile-options";
import {
  PROFILE_BIO_MAX_CHARACTERS,
} from "@/lib/profiles/profile-bio";

const RANK_DIVISIONS = [1, 2, 3, 4, 5] as const;

type AccountFormProps = {
  profile: {
    battlenet_handle: string | null;
    bio: string | null;
    current_rank_division: number | null;
    current_rank_tier: string | null;
    display_name: string;
    looking_for: string[] | null;
    platform: string | null;
    region: string | null;
    timezone: string | null;
    twitch_url: string | null;
    username: string;
    x_url: string | null;
    youtube_url: string | null;
  };
};

type SectionProps = {
  title?: string;
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

function AccountSection({ title, children }: SectionProps) {
  return (
    <section className="rounded-[22px] border border-zinc-800 bg-zinc-950/70 px-4 py-4">
      {title ? (
        <h2 className="mb-4 text-sm font-semibold tracking-[-0.02em] text-zinc-100">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

export function AccountForm({ profile }: AccountFormProps) {
  const [region, setRegion] = useState(profile.region ?? "");
  const [timezone, setTimezone] = useState(profile.timezone ?? "");
  const [platform, setPlatform] = useState(profile.platform ?? "");
  const [lookingFor, setLookingFor] = useState<string[]>(
    profile.looking_for ?? []
  );

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

    if (!nextTimezoneOptions.some((value) => value === timezone)) {
      setTimezone("");
    }
  }

  function toggleLookingFor(option: string) {
    setLookingFor((current) =>
      current.includes(option)
        ? current.filter((value) => value !== option)
        : [...current, option]
    );
  }

  return (
    <form action={updateProfile} className="grid gap-4">
      <AccountSection>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              Username
            </p>
            <p className="mt-1.5 text-sm font-medium text-zinc-100">
              @{profile.username}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              Display name
            </p>
            <p className="mt-1.5 text-sm font-medium text-zinc-100">
              {profile.display_name}
            </p>
          </div>
        </div>

        <label className="mt-3 grid gap-2 text-sm text-zinc-300">
          <span>Bio</span>
          <textarea
            name="bio"
            rows={4}
            maxLength={PROFILE_BIO_MAX_CHARACTERS}
            defaultValue={profile.bio ?? ""}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition focus:border-sky-400"
          />
          <p className="text-xs text-zinc-500">
            Up to {PROFILE_BIO_MAX_CHARACTERS} characters.
          </p>
        </label>
      </AccountSection>

      <AccountSection title="Socials">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-sm text-zinc-300">
            <span>Battle.net</span>
            <input
              name="battlenet_handle"
              type="text"
              defaultValue={profile.battlenet_handle ?? ""}
              placeholder="Player#1234"
              maxLength={40}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition focus:border-sky-400"
            />
          </label>

          <label className="grid gap-2 text-sm text-zinc-300">
            <span>Twitch</span>
            <input
              name="twitch_url"
              type="text"
              defaultValue={profile.twitch_url ?? ""}
              placeholder="https://twitch.tv/username"
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition focus:border-sky-400"
            />
          </label>

          <label className="grid gap-2 text-sm text-zinc-300">
            <span>X</span>
            <input
              name="x_url"
              type="text"
              defaultValue={profile.x_url ?? ""}
              placeholder="https://x.com/username"
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition focus:border-sky-400"
            />
          </label>

          <label className="grid gap-2 text-sm text-zinc-300">
            <span>YouTube</span>
            <input
              name="youtube_url"
              type="text"
              defaultValue={profile.youtube_url ?? ""}
              placeholder="https://youtube.com/@channel"
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition focus:border-sky-400"
            />
          </label>
        </div>
      </AccountSection>

      <AccountSection>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_1.05fr]">
          <label className="grid gap-2 text-sm text-zinc-300">
            <span>Region</span>
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
            <span>Server</span>
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
                    className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-medium outline-none transition ${
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

      <AccountSection>
        <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-2 text-sm text-zinc-300">
            <span>Rank</span>
            <div className="grid gap-3 sm:grid-cols-2">
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

              <select
                name="current_rank_division"
                defaultValue={profile.current_rank_division?.toString() ?? ""}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none transition focus:border-sky-400"
              >
                <option value="">Division</option>
                {RANK_DIVISIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-2 text-sm text-zinc-300">
            <span>Current</span>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-medium text-zinc-100">
              {formatRank(profile.current_rank_tier, profile.current_rank_division)}
            </div>
          </div>
        </div>
      </AccountSection>

      <AccountSection title="Looking for">
        {lookingFor.map((option) => (
          <input key={option} type="hidden" name="looking_for" value={option} />
        ))}

        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-11 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-sm font-medium text-zinc-200 hover:bg-zinc-900 hover:text-zinc-100"
              >
                Select
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-64 border-zinc-800 bg-zinc-950 p-2"
            >
              <div className="grid gap-2">
                {LOOKING_FOR_OPTIONS.map((option) => {
                  const isSelected = lookingFor.includes(option);

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleLookingFor(option)}
                      className={`flex items-center justify-between rounded-2xl border px-3 py-2.5 text-sm font-medium transition ${
                        isSelected
                          ? "border-sky-400 bg-sky-400/12 text-zinc-50"
                          : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100"
                      }`}
                    >
                      <span>{option}</span>
                      <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        {isSelected ? "On" : "Off"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {lookingFor.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggleLookingFor(option)}
              className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-700 hover:text-zinc-100"
            >
              {option}
            </button>
          ))}
        </div>
      </AccountSection>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          className="rounded-full bg-sky-400 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300"
        >
          Save
        </button>
      </div>
    </form>
  );
}
