"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { FaDiscord, FaTwitch, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { SiBattledotnet } from "react-icons/si";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { REGION_OPTIONS } from "@/lib/profiles/profile-options";
import { PROFILE_BIO_MAX_CHARACTERS } from "@/lib/profiles/profile-bio";

import type { ProfileEditProfile } from "./profile-edit-types";

type ProfileEditFormState = {
  battleNetHandle: string;
  bio: string;
  displayName: string;
  selectedRegion: string;
  selectedTimezone: string;
  timezoneOptions: string[];
  twitchHandle: string;
  xHandle: string;
  youtubeHandle: string;
  setBattleNetHandle: (value: string) => void;
  setBio: (value: string) => void;
  setDisplayName: (value: string) => void;
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

function DropdownField({
  disabled = false,
  inputName,
  label,
  onSelect,
  options,
  placeholder,
  value,
}: {
  disabled?: boolean;
  inputName: string;
  label: string;
  onSelect: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  value: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </span>
      <input type="hidden" name={inputName} value={value} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={`inline-flex h-11 w-full items-center justify-between rounded-2xl border px-3.5 text-left text-sm outline-none transition ${
              disabled
                ? "cursor-not-allowed border-white/6 bg-white/2 text-zinc-600 opacity-60"
                : "border-white/10 bg-white/4 text-zinc-100 hover:border-white/20"
            }`}
          >
            <span className={value ? "text-zinc-100" : "text-zinc-500"}>
              {value || placeholder}
            </span>
            <ChevronDownIcon className="h-4 w-4 shrink-0 text-zinc-600" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="z-120 w-(--radix-dropdown-menu-trigger-width)"
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

const socialInput =
  "h-11 w-full rounded-2xl border border-white/10 bg-white/4 pl-10 pr-3.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 transition hover:border-white/20 focus:border-white/20";

export function ProfileEditFormFields({
  form,
  profile,
}: ProfileEditFormFieldsProps) {
  return (
    <div>
      {/* Identity */}
      <div className="grid gap-2.5 pb-6">
        <input
          name="display_name"
          type="text"
          value={form.displayName}
          onChange={(e) => form.setDisplayName(e.target.value)}
          placeholder="Display name"
          aria-label="Display name"
          className="h-11 w-full rounded-2xl border border-white/10 bg-white/4 px-3.5 text-[15px] text-zinc-100 outline-none placeholder:text-zinc-500 transition hover:border-white/20 focus:border-white/20"
        />
        <div>
          <textarea
            name="bio"
            rows={3}
            value={form.bio}
            onChange={(e) => form.setBio(e.target.value)}
            maxLength={PROFILE_BIO_MAX_CHARACTERS}
            placeholder="Bio"
            aria-label="Bio"
            className="w-full resize-none rounded-2xl border border-white/10 bg-white/4 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 transition hover:border-white/20 focus:border-white/20"
          />
          <p className="mt-1 text-right text-xs text-zinc-600">
            {form.bio.length}/{PROFILE_BIO_MAX_CHARACTERS}
          </p>
        </div>
      </div>

      {/* Socials */}
      <div className="grid gap-2.5 border-t border-white/6 py-6">
        {profile.discordUsername ? (
          <div className="flex h-11 items-center gap-3 rounded-2xl border border-white/6 bg-white/2 px-3.5">
            <FaDiscord className="h-4 w-4 shrink-0 text-[#5865F2]" />
            <span className="text-sm text-zinc-400">{profile.discordUsername}</span>
          </div>
        ) : null}

        <div className="relative">
          <SiBattledotnet className="pointer-events-none absolute left-3.5 top-1/2 h-3.75 w-3.75 -translate-y-1/2 text-[#00AEF0]" />
          <input
            name="battlenet_handle"
            type="text"
            value={form.battleNetHandle}
            onChange={(e) => form.setBattleNetHandle(e.target.value)}
            placeholder="Battle.net tag"
            aria-label="Battle.net tag"
            maxLength={40}
            className={socialInput}
          />
        </div>

        <div className="relative">
          <FaTwitch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9146FF]" />
          <input
            type="text"
            value={form.twitchHandle}
            onChange={(e) => form.setTwitchHandle(e.target.value)}
            placeholder="Twitch username"
            aria-label="Twitch username"
            maxLength={100}
            className={socialInput}
          />
        </div>

        <div className="relative">
          <FaXTwitter className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={form.xHandle}
            onChange={(e) => form.setXHandle(e.target.value)}
            placeholder="X username"
            aria-label="X username"
            maxLength={60}
            className={socialInput}
          />
        </div>

        <div className="relative">
          <FaYoutube className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#FF0033]" />
          <input
            type="text"
            value={form.youtubeHandle}
            onChange={(e) => form.setYoutubeHandle(e.target.value)}
            placeholder="YouTube channel"
            aria-label="YouTube channel"
            maxLength={100}
            className={socialInput}
          />
        </div>
      </div>

      {/* Region & Server */}
      <div className="grid gap-3 border-t border-white/6 pt-6 sm:grid-cols-2">
        <DropdownField
          inputName="region"
          label="Region"
          value={form.selectedRegion}
          placeholder="Select region"
          options={REGION_OPTIONS}
          onSelect={form.handleRegionSelect}
        />
        <DropdownField
          disabled={!form.selectedRegion}
          inputName="timezone"
          label="Server"
          value={form.selectedTimezone}
          placeholder={form.selectedRegion ? "Select server" : "Pick region first"}
          options={form.timezoneOptions}
          onSelect={form.setSelectedTimezone}
        />
      </div>
    </div>
  );
}
