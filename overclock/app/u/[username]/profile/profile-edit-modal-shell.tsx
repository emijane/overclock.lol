"use client";

import type { ReactNode } from "react";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaDiscord, FaTwitch, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { SiBattledotnet } from "react-icons/si";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { updateProfile } from "@/app/account/actions";
import {
  PLATFORM_OPTIONS,
  RANK_TIERS,
  REGION_OPTIONS,
  REGION_TO_TIMEZONES,
} from "@/lib/profiles/profile-options";

type SocialValues = {
  battlenet: string;
  twitch: string;
  x: string;
  youtube: string;
};

type ProfileEditModalShellProps = {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
  profile: {
    bio: string | null;
    currentRankDivision: number | null;
    currentRankTier: string | null;
    discordUsername: string | null;
    displayName: string;
    hasDiscordUser: boolean;
    lookingFor: string[];
    platform: string | null;
    region: string | null;
    returnTo: string;
    socials: SocialValues;
    timezone: string | null;
  };
};

function ModalSection({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-zinc-800 bg-zinc-950/70 px-4 py-4">
      {title ? (
        <h3 className="mb-4 text-sm font-semibold tracking-[-0.02em] text-zinc-100">
          {title}
        </h3>
      ) : null}
      {children}
    </section>
  );
}

function SocialLabel({
  children,
  icon,
}: {
  children: ReactNode;
  icon: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-zinc-300">
      <span className="text-zinc-500">{icon}</span>
      <span>{children}</span>
    </span>
  );
}

function stripSocialPrefix(value: string, prefixes: string[]) {
  const normalizedValue = value.trim();

  for (const prefix of prefixes) {
    if (normalizedValue.toLowerCase().startsWith(prefix.toLowerCase())) {
      return normalizedValue.slice(prefix.length);
    }
  }

  return normalizedValue;
}

function normalizeHandle(value: string) {
  return value.trim().replace(/^@+/, "");
}

function buildSocialUrl(prefix: string, value: string) {
  const normalizedValue = normalizeHandle(value);
  return normalizedValue ? `${prefix}${normalizedValue}` : "";
}

function ModalDropdownField({
  disabled = false,
  inputName,
  label,
  hideLabel = false,
  onSelect,
  options,
  placeholder,
  value,
}: {
  disabled?: boolean;
  inputName: string;
  label: string;
  hideLabel?: boolean;
  onSelect: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  value: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm text-zinc-300">
      {hideLabel ? <span className="sr-only">{label}</span> : <span>{label}</span>}
      <input type="hidden" name={inputName} value={value} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={`inline-flex h-11 w-full items-center justify-between rounded-2xl border bg-zinc-950 px-3.5 text-left text-sm text-zinc-100 outline-none transition ${
              disabled
                ? "cursor-not-allowed border-zinc-800 text-zinc-500 opacity-60"
                : "border-zinc-800 hover:border-zinc-700"
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

export function ProfileEditModalShell({
  isOpen,
  onClose,
  children,
  profile,
}: ProfileEditModalShellProps) {
  const [battleNetHandle, setBattleNetHandle] = useState(profile.socials.battlenet);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [selectedRankTier, setSelectedRankTier] = useState(profile.currentRankTier ?? "");
  const [selectedRankDivision, setSelectedRankDivision] = useState(
    profile.currentRankDivision?.toString() ?? ""
  );
  const [selectedRegion, setSelectedRegion] = useState(profile.region ?? "");
  const [selectedTimezone, setSelectedTimezone] = useState(profile.timezone ?? "");
  const [selectedPlatform, setSelectedPlatform] = useState(profile.platform ?? "");
  const [showDiscordUser, setShowDiscordUser] = useState(profile.hasDiscordUser);
  const [twitchHandle, setTwitchHandle] = useState(
    stripSocialPrefix(profile.socials.twitch, [
      "https://twitch.tv/",
      "http://twitch.tv/",
      "https://www.twitch.tv/",
      "http://www.twitch.tv/",
      "twitch.tv/",
      "www.twitch.tv/",
    ])
  );
  const [xHandle, setXHandle] = useState(
    stripSocialPrefix(profile.socials.x, [
      "https://x.com/",
      "http://x.com/",
      "https://www.x.com/",
      "http://www.x.com/",
      "https://twitter.com/",
      "http://twitter.com/",
      "https://www.twitter.com/",
      "http://www.twitter.com/",
      "x.com/",
      "twitter.com/",
      "www.x.com/",
      "www.twitter.com/",
    ])
  );
  const [youtubeHandle, setYoutubeHandle] = useState(
    stripSocialPrefix(profile.socials.youtube, [
      "https://youtube.com/@",
      "http://youtube.com/@",
      "https://www.youtube.com/@",
      "http://www.youtube.com/@",
      "youtube.com/@",
      "www.youtube.com/@",
    ])
  );
  const rankDivisionOptions = ["1", "2", "3", "4", "5"];
  const currentRankDisplay = selectedRankTier
    ? selectedRankTier === "Unranked"
      ? "Unranked"
      : [selectedRankTier, selectedRankDivision].filter(Boolean).join(" ")
    : "Not set";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const timezoneOptions = selectedRegion
    ? [...(REGION_TO_TIMEZONES[selectedRegion as keyof typeof REGION_TO_TIMEZONES] ?? [])]
    : [];

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[110] bg-zinc-950/88"
      onClick={onClose}
    >
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-modal-title"
          className="flex h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/40 sm:h-auto sm:max-h-[88vh] sm:rounded-[32px]"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex items-center justify-between gap-4 border-b border-zinc-800 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                Profile
              </p>
              <h2
                id="edit-profile-modal-title"
                className="mt-1 text-xl font-semibold tracking-[-0.03em] text-zinc-50"
              >
                Edit profile
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/80 text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-950"
              aria-label="Close edit profile modal"
            >
              <XIcon className="h-4.5 w-4.5" />
            </button>
          </header>

          <form action={updateProfile} className="flex min-h-0 flex-1 flex-col">
            <input type="hidden" name="return_to" value={profile.returnTo} />
            {profile.lookingFor.map((option) => (
              <input key={option} type="hidden" name="looking_for" value={option} />
            ))}
            <input type="hidden" name="twitch_url" value={buildSocialUrl("https://twitch.tv/", twitchHandle)} />
            <input type="hidden" name="x_url" value={buildSocialUrl("https://x.com/", xHandle)} />
            <input
              type="hidden"
              name="youtube_url"
              value={buildSocialUrl("https://youtube.com/@", youtubeHandle)}
            />

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
              {children ?? (
                <div className="grid gap-4">
                <ModalSection>
                  <div className="grid gap-3">
                    <label className="grid gap-2 text-sm text-zinc-300">
                      <span>Display name</span>
                      <input
                        name="display_name"
                        type="text"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none"
                      />
                    </label>
                  </div>

                  <label className="mt-3 grid gap-2 text-sm text-zinc-300">
                    <span>Bio</span>
                    <textarea
                      name="bio"
                      rows={4}
                      value={bio}
                      onChange={(event) => setBio(event.target.value)}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none"
                    />
                  </label>
                </ModalSection>

                <ModalSection title="Socials">
                  <div className="mb-3 flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 py-3">
                    <div className="min-w-0">
                      <p className="inline-flex items-center gap-2 text-sm font-medium text-zinc-100">
                        <FaDiscord className="h-4 w-4 text-[#5865F2]" />
                        <span>Display Discord user</span>
                      </p>
                      {profile.discordUsername ? (
                        <p className="mt-0.5 text-sm text-zinc-500">
                          {profile.discordUsername}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center">
                      <Switch
                        checked={showDiscordUser}
                        onCheckedChange={setShowDiscordUser}
                        aria-label="Toggle Discord user visibility"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="grid gap-1.5 text-sm text-zinc-300">
                      <SocialLabel
                        icon={<SiBattledotnet className="h-4 w-4 text-[#00AEF0]" />}
                      >
                        Battle.net
                      </SocialLabel>
                      <input
                        name="battlenet_handle"
                        type="text"
                        value={battleNetHandle}
                        onChange={(event) => setBattleNetHandle(event.target.value)}
                        placeholder="Player#1234"
                        className="h-11 rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 text-zinc-100 outline-none"
                      />
                    </label>

                    <label className="grid gap-1.5 text-sm text-zinc-300">
                      <SocialLabel
                        icon={<FaTwitch className="h-4 w-4 text-[#9146FF]" />}
                      >
                        Twitch
                      </SocialLabel>
                      <div className="flex h-11 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
                        <span className="inline-flex items-center px-3 pr-0 text-sm text-zinc-500">
                          twitch.tv/
                        </span>
                        <input
                          type="text"
                          value={twitchHandle}
                          onChange={(event) => setTwitchHandle(event.target.value)}
                          placeholder="username"
                          className="min-w-0 flex-1 bg-transparent pl-0 pr-3.5 text-zinc-100 outline-none"
                        />
                      </div>
                    </label>

                    <label className="grid gap-1.5 text-sm text-zinc-300">
                      <span className="inline-flex items-center text-zinc-300">
                        <FaXTwitter className="h-4 w-4 text-zinc-100" />
                      </span>
                      <div className="flex h-11 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
                        <span className="inline-flex items-center px-3 pr-0 text-sm text-zinc-500">
                          x.com/
                        </span>
                        <input
                          type="text"
                          value={xHandle}
                          onChange={(event) => setXHandle(event.target.value)}
                          placeholder="username"
                          className="min-w-0 flex-1 bg-transparent pl-0 pr-3.5 text-zinc-100 outline-none"
                        />
                      </div>
                    </label>

                    <label className="grid gap-1.5 text-sm text-zinc-300">
                      <SocialLabel
                        icon={<FaYoutube className="h-4 w-4 text-[#FF0033]" />}
                      >
                        YouTube
                      </SocialLabel>
                      <div className="flex h-11 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
                        <span className="inline-flex items-center px-3 pr-0 text-sm text-zinc-500">
                          youtube.com/@
                        </span>
                        <input
                          type="text"
                          value={youtubeHandle}
                          onChange={(event) => setYoutubeHandle(event.target.value)}
                          placeholder="channel"
                          className="min-w-0 flex-1 bg-transparent pl-0 pr-3.5 text-zinc-100 outline-none"
                        />
                      </div>
                    </label>
                  </div>
                </ModalSection>

                <ModalSection title="Setup">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_1.05fr]">
                    <ModalDropdownField
                      inputName="region"
                      label="Region"
                      value={selectedRegion}
                      placeholder="Not set"
                      options={REGION_OPTIONS}
                      onSelect={(nextRegion) => {
                        setSelectedRegion(nextRegion);

                        const nextTimezoneOptions = nextRegion
                          ? [...(REGION_TO_TIMEZONES[nextRegion as keyof typeof REGION_TO_TIMEZONES] ?? [])]
                          : [];

                        if (!nextTimezoneOptions.includes(selectedTimezone)) {
                          setSelectedTimezone("");
                        }
                      }}
                    />

                    <ModalDropdownField
                      disabled={!selectedRegion}
                      inputName="timezone"
                      label="Server"
                      value={selectedTimezone}
                      placeholder={selectedRegion ? "Not set" : "Choose region first"}
                      options={timezoneOptions}
                      onSelect={setSelectedTimezone}
                    />

                    <ModalDropdownField
                      inputName="platform"
                      label="Platform"
                      value={selectedPlatform}
                      placeholder="Not set"
                      options={PLATFORM_OPTIONS}
                      onSelect={setSelectedPlatform}
                    />
                  </div>
                </ModalSection>

                <ModalSection title="Rank">
                  <p className="mb-3 text-sm text-zinc-300">
                    Current: {currentRankDisplay}
                  </p>

                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <ModalDropdownField
                      inputName="current_rank_tier"
                      hideLabel
                      label="Rank"
                      value={selectedRankTier}
                      placeholder="Select rank"
                      options={RANK_TIERS}
                      onSelect={(nextRankTier) => {
                        setSelectedRankTier(nextRankTier);

                        if (nextRankTier === "Unranked") {
                          setSelectedRankDivision("");
                        }
                      }}
                    />

                    <ModalDropdownField
                      disabled={!selectedRankTier || selectedRankTier === "Unranked"}
                      inputName="current_rank_division"
                      hideLabel
                      label="Sub-rank"
                      value={selectedRankDivision}
                      placeholder={
                        selectedRankTier
                          ? selectedRankTier === "Unranked"
                            ? "No sub-rank"
                            : "Select division"
                          : "Choose rank first"
                      }
                      options={rankDivisionOptions}
                      onSelect={setSelectedRankDivision}
                    />
                  </div>
                </ModalSection>
                </div>
              )}
            </div>

            <footer className="flex items-center justify-end gap-3 border-t border-zinc-800 px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
              >
                Close
              </button>
              <button
                type="submit"
                className="rounded-full bg-sky-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300"
              >
                Save
              </button>
            </footer>
          </form>
        </section>
      </div>
    </div>,
    document.body
  );
}
