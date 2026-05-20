import test from "node:test";
import assert from "node:assert/strict";

import { getProfileUpdateValidationError } from "../../features/profile/actions/profile-validation";
import {
  validateBattlenetHandle,
  validateSocialUrl,
} from "../../lib/profiles/profile-socials";

test("profile update validator requires a display name", () => {
  const error = getProfileUpdateValidationError({
    battlenetHandle: null,
    bio: null,
    displayName: null,
    lookingFor: [],
    region: null,
    returnTo: "/account",
    timezone: null,
    twitchUrl: null,
    xUrl: null,
    youtubeUrl: null,
  });

  assert.equal(error, "Display name is required.");
});

test("profile update validator enforces region and timezone pairing", () => {
  assert.equal(
    getProfileUpdateValidationError({
      battlenetHandle: null,
      bio: null,
      displayName: "Misa",
      lookingFor: [],
      region: null,
      returnTo: "/account",
      timezone: "US West",
      twitchUrl: null,
      xUrl: null,
      youtubeUrl: null,
    }),
    "Choose a region before selecting a server."
  );

  assert.equal(
    getProfileUpdateValidationError({
      battlenetHandle: null,
      bio: null,
      displayName: "Misa",
      lookingFor: [],
      region: "Europe",
      returnTo: "/account",
      timezone: "US West",
      twitchUrl: null,
      xUrl: null,
      youtubeUrl: null,
    }),
    "Selected server does not match the chosen region."
  );
});

test("profile update validator accepts aligned region and timezone values", () => {
  const error = getProfileUpdateValidationError({
    battlenetHandle: null,
    bio: "Flexible support player",
    displayName: "Misa",
    lookingFor: ["Duo"],
    region: "Americas",
    returnTo: "/account",
    timezone: "US West",
    twitchUrl: null,
    xUrl: null,
    youtubeUrl: null,
  });

  assert.equal(error, null);
});

test("social validators enforce host and length rules", () => {
  assert.equal(
    validateBattlenetHandle("a".repeat(41)),
    "Battle.net handle must be 40 characters or less."
  );
  assert.equal(
    validateSocialUrl("twitch_url", "https://youtube.com/watch?v=abc"),
    "Twitch URL must use twitch.tv."
  );
  assert.equal(
    validateSocialUrl("x_url", "notaurl"),
    "Enter a valid URL."
  );
  assert.equal(
    validateSocialUrl("youtube_url", "ftp://youtube.com/watch?v=abc"),
    "URL must start with http:// or https://."
  );
});
