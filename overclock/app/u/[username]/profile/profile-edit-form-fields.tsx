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
    <div>
      <input type="hidden" name={inputName} value={value} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label={label}
            className={`inline-flex h-9 w-full items-center justify-between rounded-xl border px-3 text-left text-sm outline-none transition ${
              disabled
                ? "cursor-not-allowed border-white/6 bg-white/2 text-zinc-600 opacity-60"
                : "border-white/10 bg-white/4 text-zinc-100 hover:border-white/20"
            }`}
          >
            <span className={value ? "text-zinc-100" : "text-zinc-500"}>
              {value || placeholder}
            </span>
            <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
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
    </div>
  );
}

const socialInput =
  "h-9 w-full rounded-xl border border-white/10 bg-white/4 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 transition hover:border-white/20 focus:border-white/20";

export function ProfileEditFormFields({
  form,
  profile,
}: ProfileEditFormFieldsProps) {
  return (
    <div className="grid gap-3">
      {/* Identity */}
      <div className="grid gap-2">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-2 text-[11px] font-medium text-zinc-500">
            Name
          </span>
          <input
            name="display_name"
            type="text"
            value={form.displayName}
            onChange={(e) => form.setDisplayName(e.target.value)}
            aria-label="Display name"
            className="h-14 w-full rounded-xl border border-white/10 bg-white/4 px-3 pb-2 pt-6 text-sm text-zinc-100 outline-none transition hover:border-white/20 focus:border-white/20"
          />
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-2 text-[11px] font-medium text-zinc-500">
            Bio
          </span>
          <textarea
            name="bio"
            rows={3}
            value={form.bio}
            onChange={(e) => form.setBio(e.target.value)}
            maxLength={PROFILE_BIO_MAX_CHARACTERS}
            aria-label="Bio"
            className="w-full resize-none rounded-xl border border-white/10 bg-white/4 px-3 pb-5 pt-6 text-sm text-zinc-100 outline-none transition hover:border-white/20 focus:border-white/20"
          />
          <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-zinc-600">
            {form.bio.length}/{PROFILE_BIO_MAX_CHARACTERS}
          </span>
        </div>
      </div>

      {/* Socials — 2-col grid */}
      <div className="grid gap-2">
        {profile.discordUsername ? (
          <div className="rounded-xl border border-white/6 bg-white/2 px-3 py-2">
            <p className="text-[11px] font-medium text-zinc-500">Currently logged in as</p>
            <div className="mt-1.5 flex items-center gap-2">
              <FaDiscord className="h-3.5 w-3.5 shrink-0 text-[#5865F2]" />
              <span className="text-sm text-zinc-300">{profile.discordUsername}</span>
            </div>
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
          <SiBattledotnet className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#00AEF0]" />
          <input
            name="battlenet_handle"
            type="text"
            value={form.battleNetHandle}
            onChange={(e) => form.setBattleNetHandle(e.target.value)}
            placeholder="Battle.net"
            aria-label="Battle.net tag"
            maxLength={40}
            className={socialInput}
          />
        </div>

        <div className="relative">
          <FaTwitch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9146FF]" />
          <input
            type="text"
            value={form.twitchHandle}
            onChange={(e) => form.setTwitchHandle(e.target.value)}
            placeholder="Twitch"
            aria-label="Twitch username"
            maxLength={100}
            className={socialInput}
          />
        </div>

        <div className="relative">
          <FaXTwitter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={form.xHandle}
            onChange={(e) => form.setXHandle(e.target.value)}
            placeholder="X"
            aria-label="X username"
            maxLength={60}
            className={socialInput}
          />
        </div>

        <div className="relative">
          <FaYoutube className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#FF0033]" />
          <input
            type="text"
            value={form.youtubeHandle}
            onChange={(e) => form.setYoutubeHandle(e.target.value)}
            placeholder="YouTube"
            aria-label="YouTube channel"
            maxLength={100}
            className={socialInput}
          />
        </div>
        </div>
      </div>

      {/* Region & Server */}
      <div className="grid grid-cols-2 gap-2">
        <DropdownField
          inputName="region"
          label="Region"
          value={form.selectedRegion}
          placeholder="Region"
          options={REGION_OPTIONS}
          onSelect={form.handleRegionSelect}
        />
        <DropdownField
          disabled={!form.selectedRegion}
          inputName="timezone"
          label="Server"
          value={form.selectedTimezone}
          placeholder={form.selectedRegion ? "Server" : "Region first"}
          options={form.timezoneOptions}
          onSelect={form.setSelectedTimezone}
        />
      </div>
    </div>
  );
}
