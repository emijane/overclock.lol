const SOCIAL_URL_RULES = {
  twitch_url: ["twitch.tv"],
  x_url: ["x.com", "twitter.com"],
  youtube_url: ["youtube.com", "youtu.be"],
} as const;

type SocialUrlFieldName = keyof typeof SOCIAL_URL_RULES;

function optionalTrimmedString(value: FormDataEntryValue | null) {
  const parsed = value?.toString().trim() ?? "";
  return parsed.length > 0 ? parsed : null;
}

export function sanitizeBattlenetHandle(value: FormDataEntryValue | null) {
  const parsed = optionalTrimmedString(value);

  if (!parsed) {
    return null;
  }

  return parsed.replace(/\s+/g, " ");
}

export function validateBattlenetHandle(handle: string | null) {
  if (!handle) {
    return null;
  }

  if (handle.length > 40) {
    return "Battle.net handle must be 40 characters or less.";
  }

  return null;
}

export function sanitizeSocialUrl(value: FormDataEntryValue | null) {
  const parsed = optionalTrimmedString(value);

  if (!parsed) {
    return null;
  }

  if (/^https?:\/\//i.test(parsed)) {
    return parsed;
  }

  return `https://${parsed}`;
}

export function validateSocialUrl(
  fieldName: SocialUrlFieldName,
  value: string | null
) {
  if (!value) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return "Enter a valid URL.";
  }

  if (!["https:", "http:"].includes(url.protocol)) {
    return "URL must start with http:// or https://.";
  }

  const allowedHosts = SOCIAL_URL_RULES[fieldName];
  const hostname = url.hostname.toLowerCase();
  const isAllowedHost = allowedHosts.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`)
  );

  if (!isAllowedHost) {
    if (fieldName === "twitch_url") {
      return "Twitch URL must use twitch.tv.";
    }

    if (fieldName === "x_url") {
      return "X URL must use x.com or twitter.com.";
    }

    return "YouTube URL must use youtube.com or youtu.be.";
  }

  return null;
}
