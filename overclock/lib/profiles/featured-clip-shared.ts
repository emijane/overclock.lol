export const FEATURED_CLIP_PLATFORMS = [
  "twitch",
  "youtube",
  "medal",
] as const;

export type FeaturedClipPlatform = (typeof FEATURED_CLIP_PLATFORMS)[number];

export type ProfileFeaturedClip = {
  id: string;
  platform: FeaturedClipPlatform;
  position: number;
  thumbnailUrl: string | null;
  title: string | null;
  url: string;
};

const FEATURED_CLIP_MAX_TITLE_LENGTH = 80;

function optionalTrimmedString(value: FormDataEntryValue | null) {
  const parsed = value?.toString().trim() ?? "";
  return parsed.length > 0 ? parsed : null;
}

export function normalizeFeaturedClipUrl(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  return `https://${trimmedValue}`;
}

export function detectFeaturedClipPlatform(
  value: string
): FeaturedClipPlatform | null {
  const normalizedValue = normalizeFeaturedClipUrl(value);

  if (!normalizedValue) {
    return null;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(normalizedValue);
  } catch {
    return null;
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  if (
    hostname === "twitch.tv" ||
    hostname.endsWith(".twitch.tv") ||
    hostname === "clips.twitch.tv"
  ) {
    return "twitch";
  }

  if (
    hostname === "youtube.com" ||
    hostname.endsWith(".youtube.com") ||
    hostname === "youtu.be"
  ) {
    return "youtube";
  }

  if (hostname === "medal.tv" || hostname.endsWith(".medal.tv")) {
    return "medal";
  }

  return null;
}

export function sanitizeFeaturedClipTitle(value: FormDataEntryValue | null) {
  return optionalTrimmedString(value);
}

export function validateFeaturedClipInput(input: {
  title: string | null;
  url: string;
}) {
  if (!input.url) {
    return "Video URL is required.";
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(input.url);
  } catch {
    return "Enter a valid URL.";
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return "URL must start with http:// or https://.";
  }

  if (!detectFeaturedClipPlatform(input.url)) {
    return "Only Twitch, YouTube, and Medal URLs are supported.";
  }

  if (input.title && input.title.length > FEATURED_CLIP_MAX_TITLE_LENGTH) {
    return `Title must be ${FEATURED_CLIP_MAX_TITLE_LENGTH} characters or less.`;
  }

  return null;
}
