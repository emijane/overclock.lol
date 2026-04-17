"use client";

import { useState } from "react";

import {
  buildSocialUrl,
  getServerOptions,
  resetServerIfInvalid,
  SOCIAL_URL_PREFIXES,
  stripSocialPrefix,
} from "@/lib/profiles/profile-editor";

import type { ProfileEditProfile } from "./profile-edit-types";

export function useProfileEditForm(profile: ProfileEditProfile) {
  const [battleNetHandle, setBattleNetHandle] = useState(profile.socials.battlenet);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [selectedRegion, setSelectedRegion] = useState(profile.region ?? "");
  const [selectedTimezone, setSelectedTimezone] = useState(profile.timezone ?? "");
  const [selectedPlatform, setSelectedPlatform] = useState(profile.platform ?? "");
  const [twitchHandle, setTwitchHandle] = useState(
    stripSocialPrefix(profile.socials.twitch, SOCIAL_URL_PREFIXES.twitch)
  );
  const [xHandle, setXHandle] = useState(
    stripSocialPrefix(profile.socials.x, SOCIAL_URL_PREFIXES.x)
  );
  const [youtubeHandle, setYoutubeHandle] = useState(
    stripSocialPrefix(profile.socials.youtube, SOCIAL_URL_PREFIXES.youtube)
  );

  const timezoneOptions = getServerOptions(selectedRegion);
  const twitchUrl = buildSocialUrl("https://twitch.tv/", twitchHandle);
  const xUrl = buildSocialUrl("https://x.com/", xHandle);
  const youtubeUrl = buildSocialUrl("https://youtube.com/@", youtubeHandle);

  function handleRegionSelect(nextRegion: string) {
    setSelectedRegion(nextRegion);
    setSelectedTimezone(resetServerIfInvalid(nextRegion, selectedTimezone));
  }

  return {
    battleNetHandle,
    bio,
    displayName,
    selectedPlatform,
    selectedRegion,
    selectedTimezone,
    timezoneOptions,
    twitchHandle,
    twitchUrl,
    xHandle,
    xUrl,
    youtubeHandle,
    youtubeUrl,
    setBattleNetHandle,
    setBio,
    setDisplayName,
    setSelectedPlatform,
    setSelectedTimezone,
    setTwitchHandle,
    setXHandle,
    setYoutubeHandle,
    handleRegionSelect,
  };
}
