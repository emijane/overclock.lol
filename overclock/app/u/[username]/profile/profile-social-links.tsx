"use client";

import { CheckIcon } from "lucide-react";
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

function isExternalUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export function ProfileSocialLinks({ links }: ProfileSocialLinksProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!statusMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setStatusMessage(null);
      setActiveLabel(null);
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [statusMessage]);

  async function copyText(value: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  }

  async function handleAction(link: SocialLink) {
    try {
      await copyText(link.value);
      setActiveLabel(link.label);
      setStatusMessage(`${link.label} copied`);
    } catch {
      setActiveLabel(link.label);
      setStatusMessage(`Unable to copy ${link.label}`);
    }
  }

  return (
    <div className="relative flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {links.map((link) => {
          const Icon = ICONS[link.platform];
          const isActive = activeLabel === link.label;
          const shouldOpen = isExternalUrl(link.value);
          const buttonClassName = `group inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border text-zinc-200 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${
            isActive
              ? "border-sky-400/60 bg-zinc-900"
              : "border-zinc-800 bg-zinc-950/75 hover:border-zinc-700 hover:bg-zinc-900"
          }`;
          const icon = (
            <Icon
              className={`h-[17px] w-[17px] shrink-0 transition group-hover:scale-105 ${ICON_COLORS[link.platform]}`}
            />
          );

          if (shouldOpen) {
            return (
              <a
                key={link.platform}
                href={link.value}
                target="_blank"
                rel="noreferrer"
                className={buttonClassName}
                aria-label={`Open ${link.label}: ${link.value}`}
                title={`Open ${link.label}: ${link.value}`}
              >
                {icon}
              </a>
            );
          }

          return (
            <button
              key={link.platform}
              type="button"
              onClick={() => void handleAction(link)}
              className={buttonClassName}
              aria-label={`Copy ${link.label}: ${link.value}`}
              title={`Copy ${link.label}: ${link.value}`}
            >
              {icon}
            </button>
          );
        })}
      </div>

      {statusMessage ? (
        <div
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/80 px-2.5 py-1 text-[12px] font-medium tracking-[-0.01em] text-zinc-300"
          aria-live="polite"
        >
          <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      ) : null}
    </div>
  );
}
