import {
  sanitizeBattlenetHandle,
  sanitizeSocialUrl,
  validateBattlenetHandle,
  validateSocialUrl,
} from "@/lib/profiles/profile-socials";

import { accountRedirect } from "./shared";

export type ParsedProfileSocials = {
  battlenetHandle: string | null;
  twitchUrl: string | null;
  xUrl: string | null;
  youtubeUrl: string | null;
};

export function parseProfileSocials(formData: FormData): ParsedProfileSocials {
  return {
    battlenetHandle: sanitizeBattlenetHandle(formData.get("battlenet_handle")),
    twitchUrl: sanitizeSocialUrl(formData.get("twitch_url")),
    xUrl: sanitizeSocialUrl(formData.get("x_url")),
    youtubeUrl: sanitizeSocialUrl(formData.get("youtube_url")),
  };
}

export function validateProfileSocials(
  socials: ParsedProfileSocials,
  returnTo: string
) {
  const battlenetValidationError = validateBattlenetHandle(socials.battlenetHandle);
  const twitchValidationError = validateSocialUrl("twitch_url", socials.twitchUrl);
  const xValidationError = validateSocialUrl("x_url", socials.xUrl);
  const youtubeValidationError = validateSocialUrl("youtube_url", socials.youtubeUrl);

  if (battlenetValidationError) {
    accountRedirect(battlenetValidationError, returnTo);
  }

  if (twitchValidationError) {
    accountRedirect(twitchValidationError, returnTo);
  }

  if (xValidationError) {
    accountRedirect(xValidationError, returnTo);
  }

  if (youtubeValidationError) {
    accountRedirect(youtubeValidationError, returnTo);
  }
}
