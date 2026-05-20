"use client";

import { useState, useTransition } from "react";
import { ChevronDownIcon, Users2Icon } from "lucide-react";
import { useRouter } from "next/navigation";

import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import { leaveStack, sendStackJoinRequest } from "@/features/lfg/stack-actions";

type RequestToJoinState =
  | "idle"
  | "selecting_role"
  | "pending"
  | "sent"
  | "accepted"
  | "declined"
  | "already_in_stack"
  | "full"
  | "error";

type RequestToJoinButtonProps = {
  guestNextHref?: string;
  lookingForRoles: CompetitiveRole[];
  postId: string;
  initialState?: "none" | "pending" | "accepted" | "declined";
  tone?: "default" | "duos";
  viewerState?: "guest" | "owner" | "authenticated";
};

const ROLE_LABELS: Record<CompetitiveRole, string> = {
  tank: "Tank",
  dps: "DPS",
  support: "Support",
};

function getPillClassName(tone: "default" | "duos", emphasized = false) {
  if (tone === "duos") {
    return emphasized
      ? "oc-profile-display rounded-full border-white/[0.06] bg-white/[0.03] text-zinc-200 hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-zinc-50"
      : "oc-profile-meta rounded-full border-white/[0.06] bg-white/[0.03] text-zinc-500 hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-zinc-300";
  }

  return emphasized
    ? "rounded-[7px] border-white/[0.08] bg-white/[0.035] text-zinc-300 hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-zinc-100"
    : "rounded-[7px] border-white/[0.08] bg-white/[0.028] text-zinc-500";
}

export function RequestToJoinButton({
  guestNextHref = "/stacks",
  lookingForRoles,
  postId,
  initialState = "none",
  tone = "default",
  viewerState = "guest",
}: RequestToJoinButtonProps) {
  const router = useRouter();
  const [uiState, setUiState] = useState<RequestToJoinState>(
    initialState === "pending"
      ? "pending"
      : initialState === "accepted"
        ? "accepted"
        : initialState === "declined"
          ? "declined"
          : "idle"
  );
  const [isPending, startTransition] = useTransition();

  if (viewerState === "guest") {
    return (
      <a
        href={`/login?next=${encodeURIComponent(guestNextHref)}`}
        className={`flex h-7 items-center gap-1.5 border px-2.5 text-[11px] font-semibold transition ${getPillClassName(
          tone,
          true
        )}`}
      >
        <Users2Icon className="h-3.5 w-3.5 shrink-0" />
        Request to Join
      </a>
    );
  }

  if (viewerState === "owner") {
    return null;
  }

  if (uiState === "accepted") {
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const formData = new FormData();
            formData.set("post_id", postId);
            const result = await leaveStack(formData);

            if (result.success) {
              setUiState("idle");
              router.refresh();
              return;
            }

            setUiState("error");
          })
        }
        className={`flex h-7 items-center border px-2.5 text-[11px] font-semibold transition disabled:opacity-60 ${getPillClassName(
          tone,
          true
        )}`}
      >
        {isPending ? "Leaving..." : "Leave Stack"}
      </button>
    );
  }

  if (uiState === "pending" || uiState === "sent") {
    return (
      <span
        className={`flex h-7 items-center border px-2.5 text-[11px] font-medium ${getPillClassName(
          tone
        )}`}
      >
        Request sent
      </span>
    );
  }

  if (uiState === "declined") {
    return (
      <span
        className={`flex h-7 items-center border px-2.5 text-[11px] font-medium ${getPillClassName(
          tone
        )}`}
      >
        Request declined
      </span>
    );
  }

  if (uiState === "full") {
    return (
      <span
        className={`flex h-7 items-center border px-2.5 text-[11px] font-medium ${getPillClassName(
          tone
        )}`}
      >
        Stack full
      </span>
    );
  }

  if (uiState === "already_in_stack") {
    return (
      <span
        className={`flex h-7 items-center border px-2.5 text-[11px] font-medium ${getPillClassName(
          tone
        )}`}
      >
        Already in stack
      </span>
    );
  }

  if (uiState === "selecting_role") {
    const rolesToShow =
      lookingForRoles.length > 0
        ? lookingForRoles
        : (["tank", "dps", "support"] as CompetitiveRole[]);

    function handleRoleSelect(role: CompetitiveRole) {
      startTransition(async () => {
        const formData = new FormData();
        formData.set("post_id", postId);
        formData.set("requested_role", role);
        const result = await sendStackJoinRequest(formData);

        if (result.success) {
          setUiState("sent");
        } else if (result.errorCode === "stack_full") {
          setUiState("full");
        } else if (result.errorCode === "already_in_active_stack") {
          setUiState("already_in_stack");
        } else if (result.errorCode === "role_not_needed") {
          setUiState("error");
        } else if (result.errorCode === "duplicate_pending_request") {
          setUiState("pending");
        } else if (result.errorCode === "already_member") {
          setUiState("accepted");
        } else {
          setUiState("error");
        }
      });
    }

    return (
      <div className="flex flex-wrap gap-1">
        {rolesToShow.map((role) => (
          <button
            key={role}
            type="button"
            disabled={isPending}
            onClick={() => handleRoleSelect(role)}
            className={`flex h-7 items-center border px-2.5 text-[11px] font-semibold transition disabled:opacity-50 ${getPillClassName(
              tone,
              true
            )}`}
          >
            {ROLE_LABELS[role]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setUiState("idle")}
          className={`flex h-7 items-center border px-2.5 text-[11px] transition ${
            tone === "duos"
              ? "oc-profile-meta rounded-full border-white/[0.06] bg-white/[0.03] font-semibold text-zinc-500 hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-zinc-300"
              : "rounded-[7px] border-white/[0.06] font-medium text-zinc-600 hover:border-white/[0.1] hover:text-zinc-400"
          }`}
        >
          Cancel
        </button>
      </div>
    );
  }

  if (uiState === "error") {
    return (
      <span
        className={`flex h-7 items-center border px-2.5 text-[11px] font-medium ${getPillClassName(
          tone
        )}`}
      >
        Action unavailable
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setUiState("selecting_role")}
      className={`flex h-7 items-center gap-1.5 border px-2.5 text-[11px] font-semibold transition ${getPillClassName(
        tone,
        true
      )}`}
    >
      <Users2Icon className="h-3.5 w-3.5 shrink-0" />
      Request to Join
      <ChevronDownIcon className="h-3 w-3 shrink-0 text-zinc-500" />
    </button>
  );
}
