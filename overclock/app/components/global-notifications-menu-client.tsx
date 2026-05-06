"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellIcon } from "lucide-react";

import { acceptPlayInvite, declinePlayInvite } from "@/app/matches/actions";
import type { IncomingPendingPlayInvite } from "@/lib/matches/play-invites";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlayInviteRealtimeRefresh } from "@/app/components/play-invite-realtime-refresh";

type GlobalNotificationsMenuClientProps = {
  currentProfileId: string;
  initialInvites: IncomingPendingPlayInvite[];
  initialTotalCount: number;
};

function getAvatarFallback(name: string | null, username: string | null) {
  const fallbackSource = name ?? username ?? "P";
  return fallbackSource.slice(0, 1).toUpperCase();
}

function formatExpiryLabel(expiresAt: string, createdAt: string) {
  const expiresAtDate = new Date(expiresAt).getTime();
  const now = Date.now();
  const remainingMs = expiresAtDate - now;

  if (remainingMs <= 0) {
    return "Expired";
  }

  const remainingMinutes = Math.round(remainingMs / (60 * 1000));

  if (remainingMinutes < 60) {
    return `${remainingMinutes}m left`;
  }

  const remainingHours = Math.round(remainingMinutes / 60);

  if (remainingHours < 24) {
    return `${remainingHours}h left`;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(createdAt));
}

export function GlobalNotificationsMenuClient({
  currentProfileId,
  initialInvites,
  initialTotalCount,
}: GlobalNotificationsMenuClientProps) {
  const router = useRouter();
  const [invites, setInvites] = useState(initialInvites);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [activeInviteId, setActiveInviteId] = useState<string | null>(null);
  const [feedbackByInviteId, setFeedbackByInviteId] = useState<
    Record<string, string | null>
  >({});
  const [isPending, startTransition] = useTransition();

  function setInviteFeedback(inviteId: string, message: string | null) {
    setFeedbackByInviteId((current) => ({
      ...current,
      [inviteId]: message,
    }));
  }

  function removeInvite(inviteId: string) {
    setInvites((current) => current.filter((invite) => invite.id !== inviteId));
    setTotalCount((current) => Math.max(0, current - 1));
  }

  function handleInviteAction(
    inviteId: string,
    action: "accept" | "decline"
  ) {
    setInviteFeedback(inviteId, null);
    setActiveInviteId(inviteId);

    startTransition(async () => {
      const result =
        action === "accept"
          ? await acceptPlayInvite({ inviteId })
          : await declinePlayInvite({ inviteId });

      if (result.status === "success") {
        removeInvite(inviteId);
        setActiveInviteId(null);
        router.refresh();
        return;
      }

      if (result.status === "unauthenticated") {
        setInviteFeedback(inviteId, "Your session expired. Sign in again.");
        setActiveInviteId(null);
        return;
      }

      if (result.status === "onboarding_required") {
        setInviteFeedback(inviteId, "Finish onboarding before updating invites.");
        setActiveInviteId(null);
        return;
      }

      setInviteFeedback(inviteId, result.message);
      setActiveInviteId(null);
    });
  }

  const visibleBadgeLabel = totalCount > 9 ? "9+" : String(totalCount);

  return (
    <>
      <PlayInviteRealtimeRefresh currentProfileId={currentProfileId} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Notifications"
            className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-zinc-100"
          >
            <BellIcon className="h-4.5 w-4.5" />
            {totalCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full border border-sky-300/30 bg-sky-400 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-slate-950">
                {visibleBadgeLabel}
              </span>
            ) : null}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-[23rem] rounded-2xl border border-white/10 bg-[#05070b] p-3 text-zinc-100 shadow-[0_24px_70px_rgba(0,0,0,0.35)] ring-1 ring-white/5"
        >
          {invites.length === 0 ? (
            <div className="rounded-[16px] bg-white/[0.02] px-4 py-6 text-center">
              <p className="text-sm font-medium text-zinc-200">No pending invites</p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                When someone invites you to play, it&apos;ll show up here.
              </p>
              <Link
                href="/matches"
                className="mt-4 inline-flex text-sm font-medium text-zinc-400 transition hover:text-zinc-100"
              >
                Open matches
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 pb-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Pending invites
                </p>
                <Link
                  href="/matches"
                  className="text-xs font-medium text-zinc-400 transition hover:text-zinc-100"
                >
                  Open matches
                </Link>
              </div>

              {invites.map((invite) => {
                const rowPending = isPending && activeInviteId === invite.id;

                return (
                  <article
                    key={invite.id}
                    className="rounded-[16px] border border-white/10 bg-white/[0.02] p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-900 text-sm font-semibold text-zinc-100">
                        {invite.participant.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={invite.participant.avatarUrl}
                            alt={`${invite.participant.displayName ?? invite.participant.username ?? "Player"} avatar`}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          getAvatarFallback(
                            invite.participant.displayName,
                            invite.participant.username
                          )
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-zinc-100">
                            {invite.participant.displayName ?? "Unknown player"}
                          </p>
                          {invite.participant.username ? (
                            <span className="text-xs text-zinc-500">
                              @{invite.participant.username}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-400">
                          <span>{invite.participant.rankLabel}</span>
                          {invite.participant.region ? (
                            <span>{invite.participant.region}</span>
                          ) : null}
                        </div>
                        {invite.sourcePostTitle ? (
                          <p className="mt-2 text-xs text-zinc-400">
                            From post:{" "}
                            <span className="text-zinc-200">{invite.sourcePostTitle}</span>
                          </p>
                        ) : null}
                        {invite.message ? (
                          <p className="mt-2 text-sm leading-5 text-zinc-400">
                            {invite.message}
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs text-zinc-500">
                          {formatExpiryLabel(invite.expiresAt, invite.createdAt)}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isPending}
                            aria-disabled={isPending}
                            onClick={() => handleInviteAction(invite.id, "accept")}
                            className="inline-flex h-8 items-center rounded-full bg-zinc-100 px-3 text-xs font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {rowPending ? "Accepting..." : "Accept"}
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            aria-disabled={isPending}
                            onClick={() => handleInviteAction(invite.id, "decline")}
                            className="inline-flex h-8 items-center rounded-full border border-white/10 bg-white/[0.025] px-3 text-xs font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.045] hover:text-zinc-50 disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/[0.02] disabled:text-zinc-500"
                          >
                            {rowPending ? "Declining..." : "Decline"}
                          </button>
                        </div>

                        {feedbackByInviteId[invite.id] ? (
                          <p className="mt-2 text-xs text-rose-300">
                            {feedbackByInviteId[invite.id]}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
