"use client";

export type SocialValues = {
  battlenet: string;
  twitch: string;
  x: string;
  youtube: string;
};

export type ProfileEditProfile = {
  bio: string | null;
  currentRankDivision: number | null;
  currentRankTier: string | null;
  discordUsername: string | null;
  displayName: string;
  lookingFor: string[];
  platform: string | null;
  region: string | null;
  returnTo: string;
  socials: SocialValues;
  timezone: string | null;
};
