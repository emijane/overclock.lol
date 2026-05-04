"use client";

export type SocialValues = {
  battlenet: string;
  twitch: string;
  x: string;
  youtube: string;
};

export type ProfileEditProfile = {
  bio: string | null;
  discordUsername: string | null;
  displayName: string;
  lookingFor: string[];
  region: string | null;
  returnTo: string;
  socials: SocialValues;
  timezone: string | null;
};
