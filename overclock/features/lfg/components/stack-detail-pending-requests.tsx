"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import type { IncomingPendingStackRequest } from "@/lib/lfg/stack-request-types";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";
import {
  acceptStackJoinRequest,
  declineStackJoinRequest,
} from "@/features/lfg/stack-actions";

type StackDetailPendingRequestsProps = {
  requests: IncomingPendingStackRequest[];
};

function getRequestErrorMessage(errorCode: string | null) {
  if (errorCode === "stack_full") {
    return "Stack is now full.";
  }

  if (errorCode === "already_in_active_stack") {
    return "That player already belongs to another active stack.";
  }

  if (errorCode === "role_not_needed") {
    return "That role is no longer needed.";
  }

  if (errorCode === "blocked_users" || errorCode === "forbidden") {
    return "Action unavailable.";
  }

  return "Something went wrong. Try again.";
}

export function StackDetailPendingRequests({
  requests,
}: StackDetailPendingRequestsProps) {
  const router = useRouter();
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [feedbackByRequestId, setFeedbackByRequestId] = useState<
    Record<string, string | null>
  >({});
  const [resolvedRequestIds, setResolvedRequestIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const visibleRequests = useMemo(
    () => requests.filter((request) => !resolvedRequestIds.includes(request.id)),
    [requests, resolvedRequestIds]
  );

  function handleRequestAction(requestId: string, action: "accept" | "decline") {
    setFeedbackByRequestId((current) => ({
      ...current,
      [requestId]: null,
    }));
    setActiveRequestId(requestId);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("request_id", requestId);
      const result =
        action === "accept"
          ? await acceptStackJoinRequest(formData)
          : await declineStackJoinRequest(formData);

      if (result.success) {
        setResolvedRequestIds((current) => [...current, requestId]);
        setActiveRequestId(null);
        router.refresh();
        return;
      }

      setFeedbackByRequestId((current) => ({
        ...current,
        [requestId]: getRequestErrorMessage(result.errorCode),
      }));
      setActiveRequestId(null);
    });
  }

  if (visibleRequests.length === 0) {
    return (
      <p className="oc-profile-meta text-[11px] text-zinc-500">No pending requests</p>
    );
  }

  return (
    <div className="space-y-2.5">
      {visibleRequests.map((request) => {
        const requesterLabel =
          request.requester.displayName ?? request.requester.username ?? "Player";
        const requesterHref = request.requester.username
          ? `/u/${request.requester.username}`
          : null;
        const roleLabel = COMPETITIVE_ROLE_LABELS[request.requestedRole];
        const rankLabel = request.requester.rankTier
          ? formatCurrentRank(
              request.requester.rankTier,
              request.requester.rankDivision
            )
          : null;
        const rowPending = isPending && activeRequestId === request.id;

        return (
          <div
            key={request.id}
            className="rounded-[10px] border border-white/[0.05] bg-black/12 px-4 py-3.5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/[0.08] bg-zinc-900">
                    {request.requester.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={request.requester.avatarUrl}
                        alt={requesterLabel}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-[11px] font-semibold text-zinc-200">
                        {requesterLabel.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      {requesterHref ? (
                        <Link
                          href={requesterHref}
                          className="oc-profile-display truncate text-[14px] font-semibold text-zinc-100 transition hover:text-white"
                        >
                          {requesterLabel}
                        </Link>
                      ) : (
                        <p className="oc-profile-display truncate text-[14px] font-semibold text-zinc-100">
                          {requesterLabel}
                        </p>
                      )}
                      {request.requester.username ? (
                        <span className="oc-profile-meta truncate text-[11px] text-zinc-500">
                          @{request.requester.username}
                        </span>
                      ) : null}
                    </div>
                    <div className="oc-profile-meta mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-zinc-400">
                      {rankLabel ? <span>{rankLabel}</span> : null}
                      {rankLabel ? <span aria-hidden="true" className="text-zinc-700">&bull;</span> : null}
                      <span>{roleLabel}</span>
                    </div>
                    {feedbackByRequestId[request.id] ? (
                      <p className="oc-profile-meta mt-1 text-[11px] text-rose-300">
                        {feedbackByRequestId[request.id]}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleRequestAction(request.id, "accept")}
                  className="oc-profile-display inline-flex h-8 items-center rounded-full bg-zinc-100 px-3 text-[12px] font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {rowPending ? "Working..." : "Accept"}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleRequestAction(request.id, "decline")}
                  className="oc-profile-meta inline-flex h-8 items-center rounded-full border border-white/[0.06] bg-white/[0.03] px-3 text-[11px] font-medium text-zinc-400 transition hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {rowPending ? "Working..." : "Decline"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
