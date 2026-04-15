export const FEATURED_CLIP_PLATFORMS = ["youtube"] as const;

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
  const videoId = getYouTubeVideoId(value);

  if (videoId) {
    return "youtube";
  }

  return null;
}

export function getYouTubeVideoId(value: string) {
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

  if (hostname === "youtu.be") {
    const id = parsedUrl.pathname.replace(/^\/+/, "").split("/")[0];
    return id || null;
  }

  if (hostname === "youtube.com" || hostname.endsWith(".youtube.com")) {
    if (parsedUrl.pathname === "/watch") {
      return parsedUrl.searchParams.get("v");
    }

    if (parsedUrl.pathname.startsWith("/embed/")) {
      return parsedUrl.pathname.replace("/embed/", "").split("/")[0] || null;
    }

    if (parsedUrl.pathname.startsWith("/shorts/")) {
      return parsedUrl.pathname.replace("/shorts/", "").split("/")[0] || null;
    }
  }

  return null;
}

export function getYouTubeThumbnailUrl(value: string) {
  const videoId = getYouTubeVideoId(value);

  if (!videoId) {
    return null;
  }

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getYouTubeEmbedUrl(value: string) {
  const videoId = getYouTubeVideoId(value);

  if (!videoId) {
    return null;
  }

  return `https://www.youtube.com/embed/${videoId}`;
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
    return "Only YouTube URLs are supported right now.";
  }

  if (input.title && input.title.length > FEATURED_CLIP_MAX_TITLE_LENGTH) {
    return `Title must be ${FEATURED_CLIP_MAX_TITLE_LENGTH} characters or less.`;
  }

  return null;
}
