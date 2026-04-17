"use client";

import type { ReactNode } from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { FaDiscord, FaTwitch, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { SiBattledotnet } from "react-icons/si";

import { SectionCard } from "@/components/profile-editor/section-card";
import { SetupSection } from "@/components/profile-editor/setup-section";
import { SocialsSection } from "@/components/profile-editor/socials-section";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PLATFORM_OPTIONS,
  REGION_OPTIONS,
} from "@/lib/profiles/profile-options";
import { PROFILE_BIO_MAX_CHARACTERS } from "@/lib/profiles/profile-bio";

import type { ProfileEditProfile } from "./profile-edit-types";

type ProfileEditFormState = {
  battleNetHandle: string;
  bio: string;
  displayName: string;
  selectedPlatform: string;
  selectedRegion: string;
  selectedTimezone: string;
  timezoneOptions: string[];
  twitchHandle: string;
  xHandle: string;
  youtubeHandle: string;
  setBattleNetHandle: (value: string) => void;
  setBio: (value: string) => void;
  setDisplayName: (value: string) => void;
  setSelectedPlatform: (value: string) => void;
  setSelectedTimezone: (value: string) => void;
  setTwitchHandle: (value: string) => void;
  setXHandle: (value: string) => void;
  setYoutubeHandle: (value: string) => void;
  handleRegionSelect: (value: string) => void;
};

type ProfileEditFormFieldsProps = {
  form: ProfileEditFormState;
  profile: ProfileEditProfile;
};

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

export function ProfileEditFormFields({
  form,
  profile,
}: ProfileEditFormFieldsProps) {
  return (
    <div className="grid gap-4">
      <SectionCard>
        <div className="grid gap-3">
          <label className="grid gap-2 text-sm text-zinc-300">
            <span>Display name</span>
            <input
              name="display_name"
              type="text"
              value={form.displayName}
              onChange={(event) => form.setDisplayName(event.target.value)}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none"
            />
          </label>
        </div>

        <label className="mt-3 grid gap-2 text-sm text-zinc-300">
          <span>Bio</span>
          <textarea
            name="bio"
            rows={4}
            value={form.bio}
            onChange={(event) => form.setBio(event.target.value)}
            maxLength={PROFILE_BIO_MAX_CHARACTERS}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none"
          />
          <p className="text-xs text-zinc-500">
            Up to {PROFILE_BIO_MAX_CHARACTERS} characters.
          </p>
        </label>
      </SectionCard>

      <SocialsSection
        discordVisibility={
          profile.discordUsername ? (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 py-3">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2 text-sm font-medium text-zinc-100">
                  <FaDiscord className="h-4 w-4 text-[#5865F2]" />
                  <span>Discord</span>
                </p>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {profile.discordUsername}
                </p>
              </div>
            </div>
          ) : null
        }
        fields={
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
                value={form.battleNetHandle}
                onChange={(event) => form.setBattleNetHandle(event.target.value)}
                placeholder="Player#1234"
                maxLength={40}
                className="h-11 rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 text-zinc-100 outline-none"
              />
            </label>

            <label className="grid gap-1.5 text-sm text-zinc-300">
              <SocialLabel icon={<FaTwitch className="h-4 w-4 text-[#9146FF]" />}>
                Twitch
              </SocialLabel>
              <div className="flex h-11 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
                <span className="inline-flex items-center px-3 pr-0 text-sm text-zinc-500">
                  twitch.tv/
                </span>
                <input
                  type="text"
                  value={form.twitchHandle}
                  onChange={(event) => form.setTwitchHandle(event.target.value)}
                  placeholder="username"
                  maxLength={100}
                  className="min-w-0 flex-1 bg-transparent pl-0 pr-3.5 text-zinc-100 outline-none"
                />
              </div>
            </label>

            <label className="grid gap-1.5 text-sm text-zinc-300">
              <SocialLabel icon={<FaXTwitter className="h-4 w-4 text-zinc-100" />}>
                X
              </SocialLabel>
              <div className="flex h-11 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
                <span className="inline-flex items-center px-3 pr-0 text-sm text-zinc-500">
                  x.com/
                </span>
                <input
                  type="text"
                  value={form.xHandle}
                  onChange={(event) => form.setXHandle(event.target.value)}
                  placeholder="username"
                  maxLength={60}
                  className="min-w-0 flex-1 bg-transparent pl-0 pr-3.5 text-zinc-100 outline-none"
                />
              </div>
            </label>

            <label className="grid gap-1.5 text-sm text-zinc-300">
              <SocialLabel icon={<FaYoutube className="h-4 w-4 text-[#FF0033]" />}>
                YouTube
              </SocialLabel>
              <div className="flex h-11 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
                <span className="inline-flex items-center px-3 pr-0 text-sm text-zinc-500">
                  youtube.com/@
                </span>
                <input
                  type="text"
                  value={form.youtubeHandle}
                  onChange={(event) => form.setYoutubeHandle(event.target.value)}
                  placeholder="channel"
                  maxLength={100}
                  className="min-w-0 flex-1 bg-transparent pl-0 pr-3.5 text-zinc-100 outline-none"
                />
              </div>
            </label>
          </div>
        }
      />

      <SetupSection
        regionField={
          <ModalDropdownField
            inputName="region"
            label="Region"
            value={form.selectedRegion}
            placeholder="Not set"
            options={REGION_OPTIONS}
            onSelect={form.handleRegionSelect}
          />
        }
        serverField={
          <ModalDropdownField
            disabled={!form.selectedRegion}
            inputName="timezone"
            label="Server"
            value={form.selectedTimezone}
            placeholder={form.selectedRegion ? "Not set" : "Choose region first"}
            options={form.timezoneOptions}
            onSelect={form.setSelectedTimezone}
          />
        }
        platformField={
          <ModalDropdownField
            inputName="platform"
            label="Platform"
            value={form.selectedPlatform}
            placeholder="Not set"
            options={PLATFORM_OPTIONS}
            onSelect={form.setSelectedPlatform}
          />
        }
      />
    </div>
  );
}
