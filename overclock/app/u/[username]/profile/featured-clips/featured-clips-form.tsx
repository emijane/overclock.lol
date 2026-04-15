"use client";

import { useState } from "react";

import { FeaturedClipsFormSlot } from "./featured-clips-form-slot";
import type { FeaturedClipPlatform } from "./types";

function detectPlatform(value: string): FeaturedClipPlatform | null {
  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue) {
    return null;
  }

  if (
    normalizedValue.includes("twitch.tv/") ||
    normalizedValue.includes("clips.twitch.tv/")
  ) {
    return "twitch";
  }

  if (
    normalizedValue.includes("youtube.com/") ||
    normalizedValue.includes("youtu.be/")
  ) {
    return "youtube";
  }

  if (normalizedValue.includes("medal.tv/")) {
    return "medal";
  }

  return null;
}

const EMPTY_CLIP_URLS = ["", ""] as const;

export function FeaturedClipsForm() {
  const [clipUrls, setClipUrls] = useState<[string, string]>(["", ""]);

  function updateClipUrl(index: number, value: string) {
    setClipUrls((current) => {
      const next = [...current] as [string, string];
      next[index] = value;
      return next;
    });
  }

  function clearClipUrl(index: number) {
    setClipUrls((current) => {
      const next = [...current] as [string, string];
      next[index] = "";
      return next;
    });
  }

  const hasAnyValue = clipUrls.some((value) => value.trim().length > 0);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 lg:grid-cols-2">
        {EMPTY_CLIP_URLS.map((_, index) => (
          <FeaturedClipsFormSlot
            key={index}
            index={index}
            clipUrl={clipUrls[index]}
            onClear={() => clearClipUrl(index)}
            onUrlChange={(value) => updateClipUrl(index, value)}
            platform={detectPlatform(clipUrls[index])}
          />
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!hasAnyValue}
          className="rounded-full bg-sky-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          Save featured clips
        </button>
      </div>
    </div>
  );
}
