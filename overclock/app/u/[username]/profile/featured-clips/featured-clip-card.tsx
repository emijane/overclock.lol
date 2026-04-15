"use client";

import { ExternalLinkIcon, PencilIcon, PlayIcon, Trash2Icon, TrophyIcon } from "lucide-react";
import { FaTwitch, FaYoutube } from "react-icons/fa";

import type { FeaturedClip } from "./types";

const PLATFORM_UI = {
  twitch: {
    badgeClassName: "border-[#9146FF]/40 bg-[#9146FF]/10 text-[#cdb3ff]",
    cardClassName: "from-[#1d1538] via-zinc-950 to-zinc-950",
    icon: FaTwitch,
    label: "Twitch",
  },
  youtube: {
    badgeClassName: "border-[#FF0033]/40 bg-[#FF0033]/10 text-[#ff9aae]",
    cardClassName: "from-[#321018] via-zinc-950 to-zinc-950",
    icon: FaYoutube,
    label: "YouTube",
  },
  medal: {
    badgeClassName: "border-amber-400/40 bg-amber-400/10 text-amber-200",
    cardClassName: "from-amber-950/50 via-zinc-950 to-zinc-950",
    icon: TrophyIcon,
    label: "Medal",
  },
} as const;

type FeaturedClipCardProps = {
  clip: FeaturedClip;
  isOwner?: boolean;
  onDelete?: (clip: FeaturedClip) => void;
  onEdit?: (clip: FeaturedClip) => void;
};

export function FeaturedClipCard({
  clip,
  isOwner = false,
  onDelete,
  onEdit,
}: FeaturedClipCardProps) {
  const platformUi = PLATFORM_UI[clip.platform];
  const PlatformIcon = platformUi.icon;

  return (
    <div
      className={`group overflow-hidden rounded-[22px] border border-zinc-800 bg-gradient-to-br ${platformUi.cardClassName} transition hover:border-zinc-700`}
    >
      <div className="flex aspect-[16/10] flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${platformUi.badgeClassName}`}
          >
            <PlatformIcon className="h-3.5 w-3.5" />
            {platformUi.label}
          </span>

          {isOwner ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onEdit?.(clip);
                }}
                aria-label="Edit featured video"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/25 text-zinc-200 transition hover:border-white/20 hover:text-zinc-50"
              >
                <PencilIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDelete?.(clip);
                }}
                aria-label="Remove featured video"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/25 text-zinc-200 transition hover:border-white/20 hover:text-zinc-50"
              >
                <Trash2Icon className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="max-w-[72%]">
            <p className="mt-3 text-base font-semibold leading-6 text-zinc-100">
              {clip.title || "Featured clip"}
            </p>
          </div>

          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/30 text-zinc-100">
            <PlayIcon className="ml-0.5 h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      <a
        href={clip.url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-between gap-3 border-t border-zinc-800/80 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-400"
      >
        <span className="truncate">{clip.url}</span>
        <ExternalLinkIcon className="h-4 w-4 shrink-0" />
      </a>
    </div>
  );
}
