import Link from "next/link";
import type { ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { MatchParticipant } from "@/lib/matches/play-invites";

type MatchRowIdentityProps = {
  action?: ReactNode;
  footer?: ReactNode;
  href: string | null;
  participant: MatchParticipant;
  primaryMeta?: string[];
  supportingText?: ReactNode;
};

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
  const content = (
    <>
      <Avatar className="oc-overlay-avatar h-10 w-10 shrink-0 rounded-full ring-1 ring-white/8">
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
              className="oc-profile-display truncate text-[15px] font-semibold tracking-[-0.02em] text-zinc-100 transition hover:text-white"
            >
              {title}
            </Link>
          ) : (
            <span className="oc-profile-display truncate text-[15px] font-semibold tracking-[-0.02em] text-zinc-100">
              {title}
            </span>
          )}
          {participant.username ? (
            <span className="oc-profile-meta truncate text-[11px]">@{participant.username}</span>
          ) : null}
        </div>

        {primaryMeta.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {primaryMeta.map((item) => (
              <span
                key={item}
                className="oc-profile-meta oc-profile-pill rounded-[10px] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-300"
              >
                {item}
              </span>
            ))}
          </div>
        ) : null}

        {supportingText ? <div className="mt-1.5 min-w-0">{supportingText}</div> : null}
        {footer ? <div className="mt-1.5 min-w-0">{footer}</div> : null}
      </div>

      {action ? <div className="flex shrink-0 items-center">{action}</div> : null}
    </>
  );

  return <div className="oc-list-row-hover flex items-start gap-3 px-4 py-3 sm:px-5">{content}</div>;
}
