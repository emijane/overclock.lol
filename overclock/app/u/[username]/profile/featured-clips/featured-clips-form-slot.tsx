"use client";

import { PlayIcon, TrophyIcon } from "lucide-react";
import { FaTwitch, FaYoutube } from "react-icons/fa";

import type { FeaturedClipPlatform } from "./types";

type FeaturedClipsFormSlotProps = {
  clipUrl: string;
  index: number;
  onClear: () => void;
  onUrlChange: (value: string) => void;
  platform: FeaturedClipPlatform | null;
};

const PLATFORM_UI = {
  twitch: {
    accentClassName: "from-[#1d1538] via-zinc-950 to-zinc-950",
    badgeClassName: "border-[#9146FF]/40 bg-[#9146FF]/10 text-[#cdb3ff]",
    icon: FaTwitch,
    label: "Twitch",
  },
  youtube: {
    accentClassName: "from-[#321018] via-zinc-950 to-zinc-950",
    badgeClassName: "border-[#FF0033]/40 bg-[#FF0033]/10 text-[#ff9aae]",
    icon: FaYoutube,
    label: "YouTube",
  },
  medal: {
    accentClassName: "from-amber-950/50 via-zinc-950 to-zinc-950",
    badgeClassName: "border-amber-400/40 bg-amber-400/10 text-amber-200",
    icon: TrophyIcon,
    label: "Medal",
  },
} as const;

export function FeaturedClipsFormSlot({
  clipUrl,
  index,
  onClear,
  onUrlChange,
  platform,
}: FeaturedClipsFormSlotProps) {
  const fieldId = index + 1;
  const platformUi = platform ? PLATFORM_UI[platform] : null;
  const PlatformIcon = platformUi?.icon;

  return (
    <div className="grid gap-3 rounded-[20px] border border-zinc-800 bg-zinc-950/80 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-100">Clip {fieldId}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Paste a Twitch, YouTube, or Medal clip URL.
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
        >
          Clear
        </button>
      </div>

      <label className="grid gap-1.5 text-sm text-zinc-300">
        <span>Clip URL</span>
        <input
          type="text"
          value={clipUrl}
          onChange={(event) => onUrlChange(event.target.value)}
          placeholder="Paste a clip URL"
          className="h-11 rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 text-zinc-100 outline-none"
        />
      </label>

      <div className="flex min-h-8 items-center">
        {platformUi && PlatformIcon ? (
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${platformUi.badgeClassName}`}
          >
            <PlatformIcon className="h-3.5 w-3.5" />
            {platformUi.label} detected
          </span>
        ) : clipUrl ? (
          <span className="text-xs text-amber-300">
            URL not recognized yet. Supported: Twitch, YouTube, Medal.
          </span>
        ) : (
          <span className="text-xs text-zinc-500">
            Platform will be detected automatically from the URL.
          </span>
        )}
      </div>

      <div
        className={`overflow-hidden rounded-[20px] border border-zinc-800 bg-gradient-to-br ${
          platformUi?.accentClassName ?? "from-zinc-900 via-zinc-950 to-zinc-950"
        }`}
      >
        <div className="flex aspect-[16/9] items-end justify-between p-4">
          <div className="max-w-[72%]">
            {platformUi && PlatformIcon ? (
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${platformUi.badgeClassName}`}
              >
                <PlatformIcon className="h-3.5 w-3.5" />
                {platformUi.label}
              </span>
            ) : null}
            <p className="mt-3 text-sm font-semibold text-zinc-100">
              {platformUi ? "Featured clip preview" : "Awaiting clip URL"}
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {platformUi
                ? "Saved clips can render here once database wiring is connected."
                : "Paste a supported URL to preview the detected platform style."}
            </p>
          </div>
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/30 text-zinc-100">
            <PlayIcon className="ml-0.5 h-4.5 w-4.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
