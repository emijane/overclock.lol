"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { cancelPlayInvite } from "@/features/matches/actions";

type PendingSentInviteCancelButtonProps = {
  inviteId: string;
};

export function PendingSentInviteCancelButton({
  inviteId,
}: PendingSentInviteCancelButtonProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    setFeedback(null);

    startTransition(async () => {
      const result = await cancelPlayInvite({ inviteId });

      if (result.status === "success") {
        router.refresh();
        return;
      }

      if (result.status === "unauthenticated") {
        setFeedback("Your session expired. Refresh and sign in again.");
        return;
      }

      if (result.status === "onboarding_required") {
        setFeedback("Finish onboarding before updating invites.");
        return;
      }

      setFeedback(result.message);
    });
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1.5">
      <button
        type="button"
        disabled={isPending}
        aria-disabled={isPending}
        onClick={handleCancel}
        className="oc-profile-meta inline-flex h-8 items-center rounded-[10px] border border-white/[0.06] bg-white/[0.03] px-3 text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-300 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Cancelling..." : "Cancel"}
      </button>
      {feedback ? (
        <p className="oc-profile-meta max-w-[160px] text-right text-[11px] text-rose-300">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
