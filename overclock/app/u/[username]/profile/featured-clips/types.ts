export type FeaturedClipPlatform = "twitch" | "youtube" | "medal";

export type FeaturedClip = {
  id: string;
  platform: FeaturedClipPlatform;
  thumbnailUrl: string | null;
  title: string | null;
  url: string;
};
