"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { FaDiscord, FaTwitch, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { SiBattledotnet } from "react-icons/si";

type SocialPlatform = "discord" | "battlenet" | "twitch" | "x" | "youtube";

type SocialLink = {
  label: string;
  platform: SocialPlatform;
  value: string;
};

type ProfileSocialLinksProps = {
  links: SocialLink[];
};

const ICONS = {
  discord: FaDiscord,
  battlenet: SiBattledotnet,
  twitch: FaTwitch,
  x: FaXTwitter,
  youtube: FaYoutube,
} as const;

const ICON_COLORS = {
  discord: "text-[#5865F2]",
  battlenet: "text-[#00AEF0]",
  twitch: "text-[#9146FF]",
  x: "text-zinc-100",
  youtube: "text-[#FF0033]",
} as const;

export function ProfileSocialLinks({ links }: ProfileSocialLinksProps) {
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!copiedLabel) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCopiedLabel(null);
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [copiedLabel]);

  async function handleCopy(link: SocialLink) {
    try {
      await navigator.clipboard.writeText(link.value);
      setCopiedLabel(link.label);
    } catch {
      setCopiedLabel(null);
    }
  }

  return (
    <div className="relative flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {links.map((link) => {
          const Icon = ICONS[link.platform];

          return (
            <button
              key={link.platform}
              type="button"
              onClick={() => void handleCopy(link)}
              className="group inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/75 text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
              aria-label={`Copy ${link.label}: ${link.value}`}
              title={`${link.label}: ${link.value}`}
            >
              <Icon
                className={`h-[17px] w-[17px] shrink-0 transition group-hover:scale-105 ${ICON_COLORS[link.platform]}`}
              />
            </button>
          );
        })}
      </div>

      <div
        className={`pointer-events-none absolute top-full mt-2 flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-950/95 px-3 py-1.5 text-[12px] font-medium tracking-[-0.01em] text-zinc-200 shadow-lg shadow-black/30 transition-all duration-200 sm:right-0 ${
          copiedLabel
            ? "translate-y-0 opacity-100"
            : "translate-y-1 opacity-0"
        }`}
        aria-live="polite"
      >
        {copiedLabel ? (
          <>
            <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
            <span>{copiedLabel} copied</span>
          </>
        ) : (
          <>
            <CopyIcon className="h-3.5 w-3.5 text-zinc-500" />
            <span>Copied</span>
          </>
        )}
      </div>
    </div>
  );
}
