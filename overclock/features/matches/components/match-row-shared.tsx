import Link from "next/link";
import type { ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { MatchParticipant } from "@/lib/matches/play-invites";

export type MatchMetaChip = {
  label: string;
  tone?: "primary" | "secondary" | "muted";
};

type MatchRowIdentityProps = {
  action?: ReactNode;
  footer?: ReactNode;
  href: string | null;
  participant: MatchParticipant;
  primaryMeta?: MatchMetaChip[];
  supportingText?: ReactNode;
};

export const MATCH_DESTRUCTIVE_BUTTON_CLASSNAME =
  "oc-profile-meta inline-flex h-7 items-center justify-center rounded-[9px] border border-white/[0.07] bg-black/30 px-2.5 text-[9px] font-medium uppercase tracking-[0.08em] text-zinc-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-200 hover:border-rose-400/25 hover:bg-rose-500/[0.1] hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:border-rose-400/30 active:bg-rose-500/[0.14] disabled:cursor-not-allowed disabled:opacity-60";

function getAvatarFallback(name: string | null, username: string | null) {
  const fallbackSource = name ?? username ?? "P";
  return fallbackSource.slice(0, 1).toUpperCase();
}

export function formatMatchRole(role: string | null) {
  if (!role) {
    return null;
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function formatMatchRegion(region: string | null) {
  if (!region) {
    return null;
  }

  return region.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getDisplayableMatchMetaLabel(label: string | null | undefined) {
  if (typeof label !== "string") {
    return null;
  }

  const normalizedLabel = label.trim();

  if (!normalizedLabel || normalizedLabel.toLowerCase() === "not set") {
    return null;
  }

  return normalizedLabel;
}

export function formatMatchTimestamp(label: string, value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const elapsedMs = Date.now() - date.getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60000);

  if (elapsedMinutes < 1) {
    return `${label} now`;
  }

  if (elapsedMinutes < 60) {
    return `${label} ${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);

  if (elapsedHours < 24) {
    return `${label} ${elapsedHours}h ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);

  if (elapsedDays < 7) {
    return `${label} ${elapsedDays}d ago`;
  }

  return `${label} ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date)}`;
}

export function MatchRowIdentity({
  action,
  footer,
  href,
  participant,
  primaryMeta = [],
  supportingText,
}: MatchRowIdentityProps) {
  const title = participant.displayName ?? participant.username ?? "Unknown player";

  return (
    <div className="oc-list-row-hover group px-4 py-3 sm:px-5">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Avatar className="oc-overlay-avatar-elevated h-10 w-10 shrink-0 rounded-full ring-1 ring-white/[0.06]">
            {participant.avatarUrl ? (
              <AvatarImage src={participant.avatarUrl} alt={`${title} avatar`} />
            ) : null}
            <AvatarFallback className="bg-zinc-900 text-sm text-zinc-100">
              {getAvatarFallback(participant.displayName, participant.username)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              {href ? (
                <Link
                  href={href}
                  className="oc-profile-display truncate text-[14px] font-semibold tracking-[-0.02em] text-zinc-100 transition hover:text-white"
                >
                  {title}
                </Link>
              ) : (
                <span className="oc-profile-display truncate text-[14px] font-semibold tracking-[-0.02em] text-zinc-100">
                  {title}
                </span>
              )}
              {participant.username ? (
                <span className="oc-profile-meta truncate text-[10px]">@{participant.username}</span>
              ) : null}
            </div>

            {primaryMeta.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {primaryMeta.map((item) => (
                  <span
                    key={`${item.tone ?? "secondary"}-${item.label}`}
                    className={`oc-profile-meta inline-flex min-h-[1.375rem] items-center rounded-[9px] border px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.08em] ${
                      item.tone === "primary"
                        ? "border-sky-300/18 bg-sky-400/[0.14] text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                        : item.tone === "muted"
                          ? "border-white/[0.05] bg-white/[0.02] text-zinc-500"
                          : "border-white/[0.06] bg-zinc-900/70 text-zinc-300"
                    }`}
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            ) : null}

            {supportingText ? <div className="mt-1.5 min-w-0">{supportingText}</div> : null}
            {footer ? <div className="mt-2 min-w-0">{footer}</div> : null}
          </div>
        </div>

        {action ? <div className="flex shrink-0 justify-end self-start">{action}</div> : null}
      </div>
    </div>
  );
}
