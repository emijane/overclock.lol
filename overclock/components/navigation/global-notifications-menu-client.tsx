"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { IncomingPendingPlayInvite } from "@/lib/matches/play-invites";
import type { IncomingPendingStackRequest } from "@/lib/lfg/stack-request-types";
import type { NotificationsMenuDto } from "@/lib/pages/matches-page-dto";
import { acceptPlayInvite, declinePlayInvite } from "@/features/matches/actions";
import { acceptStackJoinRequest, declineStackJoinRequest } from "@/features/lfg/stack-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlayInviteRealtimeRefresh } from "@/components/matches/play-invite-realtime-refresh";

const ROLE_LABELS: Record<string, string> = {
  tank: "Tank",
  dps: "DPS",
  support: "Support",
};

type GlobalNotificationsMenuClientProps = {
  currentProfileId: string;
  initialNotifications: NotificationsMenuDto | null;
};

function getAvatarFallback(name: string | null, username: string | null) {
  const fallbackSource = name ?? username ?? "P";
  return fallbackSource.slice(0, 1).toUpperCase();
}

export function GlobalNotificationsMenuClient({
  currentProfileId,
  initialNotifications,
}: GlobalNotificationsMenuClientProps) {
  const router = useRouter();
  const [invites, setInvites] = useState<IncomingPendingPlayInvite[]>(
    initialNotifications?.incomingInvites ?? []
  );
  const [stackRequests, setStackRequests] = useState<IncomingPendingStackRequest[]>(
    initialNotifications?.stackRequests ?? []
  );
  const [totalCount, setTotalCount] = useState(initialNotifications?.totalCount ?? 0);
  const [isLoading, setIsLoading] = useState(initialNotifications === null);
  const [activeInviteId, setActiveInviteId] = useState<string | null>(null);
  const [feedbackByInviteId, setFeedbackByInviteId] = useState<
    Record<string, string | null>
  >({});
  const [isPending, startTransition] = useTransition();

  function applyNotificationsDto(dto: NotificationsMenuDto) {
    setInvites(dto.incomingInvites);
    setStackRequests(dto.stackRequests);
    setTotalCount(dto.totalCount);
  }

  const refreshNotifications = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/notifications/menu", {
        credentials: "same-origin",
        signal,
      });

      if (!response.ok) {
        setInvites([]);
        setStackRequests([]);
        setTotalCount(0);
        return;
      }

      const dto = (await response.json()) as NotificationsMenuDto;
      applyNotificationsDto(dto);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("Failed to refresh global notifications", error);
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!initialNotifications) {
      return;
    }

    applyNotificationsDto(initialNotifications);
    setIsLoading(false);
  }, [initialNotifications]);

  useEffect(() => {
    if (initialNotifications) {
      return;
    }

    const controller = new AbortController();

    void refreshNotifications(controller.signal);

    return () => controller.abort();
  }, [currentProfileId, initialNotifications, refreshNotifications]);

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

  function removeStackRequest(requestId: string) {
    setStackRequests((current) => current.filter((req) => req.id !== requestId));
    setTotalCount((current) => Math.max(0, current - 1));
  }

  function handleStackRequestAction(requestId: string, action: "accept" | "decline") {
    setFeedbackByInviteId((prev) => ({ ...prev, [requestId]: null }));
    setActiveInviteId(requestId);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("request_id", requestId);
      const result =
        action === "accept"
          ? await acceptStackJoinRequest(formData)
          : await declineStackJoinRequest(formData);

      if (result.success) {
        removeStackRequest(requestId);
        setActiveInviteId(null);
        void refreshNotifications();
        router.refresh();
        return;
      }

      setFeedbackByInviteId((prev) => ({
        ...prev,
        [requestId]:
          result.errorCode === "stack_full"
            ? "Stack is now full."
            : result.errorCode === "already_in_active_stack"
              ? "That player already belongs to another active stack."
            : result.errorCode === "role_not_needed"
              ? "That role is no longer needed."
              : result.errorCode === "blocked_users"
                ? "Action unavailable."
                : "Something went wrong. Try again.",
      }));
      setActiveInviteId(null);
    });
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
        void refreshNotifications();
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
  const hasNotifications = invites.length > 0 || stackRequests.length > 0;

  return (
    <>
      <PlayInviteRealtimeRefresh
        currentProfileId={currentProfileId}
        onRefresh={() => refreshNotifications()}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Notifications"
            className="oc-profile-icon-button relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] border border-white/[0.06] bg-white/[0.03] text-zinc-300 transition hover:border-white/[0.10] hover:bg-white/[0.05] hover:text-zinc-100"
          >
            <BellIcon className="h-4.5 w-4.5" />
            {totalCount > 0 ? (
              <span className="oc-profile-meta absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full border border-sky-300/30 bg-sky-400 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-slate-950">
                {visibleBadgeLabel}
              </span>
            ) : null}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-[22rem] overflow-hidden rounded-[16px] border border-white/[0.06] bg-[rgba(12,12,14,0.98)] p-0 text-zinc-100 shadow-[0_18px_44px_rgba(0,0,0,0.35)] backdrop-blur-md"
        >
          {isLoading ? (
            <div className="px-5 py-8 text-center">
              <p className="oc-profile-display text-sm font-medium text-zinc-200">
                Loading notifications
              </p>
              <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                Checking for invite and stack join requests.
              </p>
            </div>
          ) : !hasNotifications ? (
            <div className="px-5 py-8 text-center">
              <p className="oc-profile-display text-sm font-medium text-zinc-200">No pending notifications</p>
              <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                Invite and stack join requests will show up here.
              </p>
              <Link
                href="/matches"
                className="oc-profile-display mt-4 inline-flex text-sm font-medium text-zinc-400 transition hover:text-zinc-100"
              >
                View all
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <p className="oc-profile-meta text-[11px] font-semibold uppercase tracking-[0.18em]">
                  Pending
                </p>
                <Link
                  href="/matches"
                  className="oc-profile-display text-xs font-medium text-zinc-400 transition hover:text-zinc-100"
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
                  const isLast = index === invites.length - 1 && stackRequests.length === 0;

                  return (
                    <li
                      key={invite.id}
                      className={!isLast ? "border-b border-white/[0.06]" : ""}
                    >
                      <div className="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-white/[0.02]">
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
                                className="oc-profile-display text-[13px] font-semibold text-zinc-100 hover:underline"
                              >
                                {invite.participant.displayName ?? invite.participant.username ?? "Unknown player"}
                              </Link>
                            ) : (
                              <span className="oc-profile-display text-[13px] font-semibold text-zinc-100">
                                {invite.participant.displayName ?? invite.participant.username ?? "Unknown player"}
                              </span>
                            )}
                            {invite.participant.username ? (
                              <span className="oc-profile-meta truncate text-[11px]">
                                @{invite.participant.username}
                              </span>
                            ) : null}
                          </div>
                          {(invite.message ?? invite.sourcePostTitle) ? (
                            <p className="oc-profile-meta mt-0.5 truncate text-[11px]">
                              {invite.message ?? invite.sourcePostTitle}
                            </p>
                          ) : null}
                          {feedbackByInviteId[invite.id] ? (
                            <p className="oc-profile-meta mt-0.5 text-[11px] text-rose-300">
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
                            className="oc-profile-display inline-flex h-6 cursor-pointer items-center rounded-[10px] bg-zinc-100 px-2.5 text-[11px] font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {rowPending ? "..." : "Accept"}
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            aria-disabled={isPending}
                            onClick={() => handleInviteAction(invite.id, "decline")}
                            className="oc-profile-meta cursor-pointer text-[10px] font-medium transition hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {rowPending ? "..." : "Decline"}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}

                {stackRequests.map((req, index) => {
                  const rowPending = isPending && activeInviteId === req.id;
                  const requesterHref = req.requester.username
                    ? `/u/${req.requester.username}`
                    : null;
                  const isLast = index === stackRequests.length - 1;
                  const roleLabel = ROLE_LABELS[req.requestedRole] ?? req.requestedRole;

                  return (
                    <li
                      key={req.id}
                      className={!isLast ? "border-b border-white/[0.06]" : ""}
                    >
                      <div className="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-white/[0.02]">
                        <Avatar className="h-8 w-8 shrink-0 rounded-full">
                          {req.requester.avatarUrl ? (
                            <AvatarImage
                              src={req.requester.avatarUrl}
                              alt={`${req.requester.displayName ?? req.requester.username ?? "Player"} avatar`}
                            />
                          ) : null}
                          <AvatarFallback className="bg-zinc-900 text-xs text-zinc-100">
                            {getAvatarFallback(req.requester.displayName, req.requester.username)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-1">
                            {requesterHref ? (
                              <Link
                                href={requesterHref}
                                className="oc-profile-display text-[13px] font-semibold text-zinc-100 hover:underline"
                              >
                                {req.requester.displayName ?? req.requester.username ?? "Unknown player"}
                              </Link>
                            ) : (
                              <span className="oc-profile-display text-[13px] font-semibold text-zinc-100">
                                {req.requester.displayName ?? req.requester.username ?? "Unknown player"}
                              </span>
                            )}
                            {req.requester.username ? (
                              <span className="oc-profile-meta truncate text-[11px]">
                                @{req.requester.username}
                              </span>
                            ) : null}
                          </div>
                          <p className="oc-profile-meta mt-0.5 truncate text-[11px]">
                            Wants to join as {roleLabel} &mdash; {req.postTitle}
                          </p>
                          {feedbackByInviteId[req.id] ? (
                            <p className="oc-profile-meta mt-0.5 text-[11px] text-rose-300">
                              {feedbackByInviteId[req.id]}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isPending}
                            aria-disabled={isPending}
                            onClick={() => handleStackRequestAction(req.id, "accept")}
                            className="oc-profile-display inline-flex h-6 cursor-pointer items-center rounded-[10px] bg-zinc-100 px-2.5 text-[11px] font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {rowPending ? "..." : "Accept"}
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            aria-disabled={isPending}
                            onClick={() => handleStackRequestAction(req.id, "decline")}
                            className="oc-profile-meta cursor-pointer text-[10px] font-medium transition hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
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
