"use client";

import { TrophyIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FaTwitch, FaYoutube } from "react-icons/fa";

import type { FeaturedClipPlatform } from "./types";

type FeaturedVideoModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

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

const PLATFORM_UI = {
  twitch: {
    badgeClassName: "border-[#9146FF]/40 bg-[#9146FF]/10 text-[#cdb3ff]",
    icon: FaTwitch,
    label: "Twitch",
  },
  youtube: {
    badgeClassName: "border-[#FF0033]/40 bg-[#FF0033]/10 text-[#ff9aae]",
    icon: FaYoutube,
    label: "YouTube",
  },
  medal: {
    badgeClassName: "border-amber-400/40 bg-amber-400/10 text-amber-200",
    icon: TrophyIcon,
    label: "Medal",
  },
} as const;

export function FeaturedVideoModal({
  isOpen,
  onClose,
}: FeaturedVideoModalProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const detectedPlatform = useMemo(() => detectPlatform(url), [url]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const platformUi = detectedPlatform ? PLATFORM_UI[detectedPlatform] : null;
  const PlatformIcon = platformUi?.icon;

  return createPortal(
    <div className="fixed inset-0 z-[120] bg-zinc-950/88" onClick={onClose}>
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="featured-video-modal-title"
          className="flex w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/40 sm:rounded-[28px]"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex items-center justify-between gap-4 border-b border-zinc-800 px-4 py-4 sm:px-5">
            <h2
              id="featured-video-modal-title"
              className="text-lg font-semibold tracking-[-0.02em] text-zinc-50"
            >
              Add featured video
            </h2>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close add featured video modal"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/80 text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-950"
            >
              <XIcon className="h-4.5 w-4.5" />
            </button>
          </header>

          <div className="grid gap-4 px-4 py-5 sm:px-5">
            <label className="grid gap-1.5 text-sm text-zinc-300">
              <span>Video URL</span>
              <input
                type="text"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="Paste a Twitch, YouTube, or Medal URL"
                className="h-11 rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 text-zinc-100 outline-none"
              />
            </label>

            <label className="grid gap-1.5 text-sm text-zinc-300">
              <span>Title</span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Optional title"
                className="h-11 rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 text-zinc-100 outline-none"
              />
            </label>

            <div className="min-h-8">
              {platformUi && PlatformIcon ? (
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium ${platformUi.badgeClassName}`}
                >
                  <PlatformIcon className="h-3.5 w-3.5" />
                  {platformUi.label}
                </span>
              ) : url ? (
                <p className="text-xs text-amber-300">
                  URL not recognized yet. Supported: Twitch, YouTube, Medal.
                </p>
              ) : (
                <p className="text-xs text-zinc-500">
                  Platform will be detected automatically from the pasted URL.
                </p>
              )}
            </div>
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-zinc-800 px-4 py-4 sm:px-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={!url.trim() || !detectedPlatform}
              className="rounded-full bg-sky-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
            >
              Save
            </button>
          </footer>
        </section>
      </div>
    </div>,
    document.body
  );
}
