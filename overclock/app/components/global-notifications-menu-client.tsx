"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellIcon } from "lucide-react";

import { acceptPlayInvite, declinePlayInvite } from "@/app/matches/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  function handleInviteAction(inviteId: string, action: "accept" | "decline") {
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
          className="w-[22rem] overflow-hidden rounded-[22px] border border-white/8 bg-[#05070b] p-0 text-zinc-100 shadow-[0_24px_70px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.04)]"
        >
          {invites.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm font-medium text-zinc-200">No pending invites</p>
              <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                When someone sends you a connection request, it&apos;ll show up here.
              </p>
              <Link
                href="/matches"
                className="mt-4 inline-flex text-sm font-medium text-zinc-400 transition hover:text-zinc-100"
              >
                View all
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Pending invites
                </p>
                <Link
                  href="/matches"
                  className="text-xs font-medium text-zinc-400 transition hover:text-zinc-100"
                >
                  View all
                </Link>
              </div>

              <ul>
                {invites.map((invite, index) => {
                  const rowPending = isPending && activeInviteId === invite.id;
                  const participantHref = invite.participant.username
                    ? `/u/${invite.participant.username}`
                    : null;

                  return (
                    <li
                      key={invite.id}
                      className={index < invites.length - 1 ? "border-b border-white/6" : ""}
                    >
                      <div className="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-white/[0.025]">
                        <Avatar className="h-8 w-8 shrink-0 rounded-full">
                          {invite.participant.avatarUrl ? (
                            <AvatarImage
                              src={invite.participant.avatarUrl}
                              alt={`${invite.participant.displayName ?? invite.participant.username ?? "Player"} avatar`}
                            />
                          ) : null}
                          <AvatarFallback className="bg-zinc-900 text-xs text-zinc-100">
                            {getAvatarFallback(
                              invite.participant.displayName,
                              invite.participant.username
                            )}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-1">
                            {participantHref ? (
                              <Link
                                href={participantHref}
                                className="text-[13px] font-semibold text-zinc-100 hover:underline"
                              >
                                {invite.participant.displayName ?? invite.participant.username ?? "Unknown player"}
                              </Link>
                            ) : (
                              <span className="text-[13px] font-semibold text-zinc-100">
                                {invite.participant.displayName ?? invite.participant.username ?? "Unknown player"}
                              </span>
                            )}
                            {invite.participant.username ? (
                              <span className="truncate text-[11px] text-zinc-500">
                                @{invite.participant.username}
                              </span>
                            ) : null}
                          </div>
                          {(invite.message ?? invite.sourcePostTitle) ? (
                            <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                              {invite.message ?? invite.sourcePostTitle}
                            </p>
                          ) : null}
                          {feedbackByInviteId[invite.id] ? (
                            <p className="mt-0.5 text-[11px] text-rose-300">
                              {feedbackByInviteId[invite.id]}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isPending}
                            aria-disabled={isPending}
                            onClick={() => handleInviteAction(invite.id, "accept")}
                            className="inline-flex h-6 cursor-pointer items-center rounded-full bg-zinc-100 px-2.5 text-[11px] font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {rowPending ? "..." : "Accept"}
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            aria-disabled={isPending}
                            onClick={() => handleInviteAction(invite.id, "decline")}
                            className="cursor-pointer text-[10px] font-medium text-zinc-600 transition hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {rowPending ? "..." : "Decline"}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
