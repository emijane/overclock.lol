"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { cancelPlayInvite } from "@/app/matches/actions";

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
        className="oc-profile-meta cursor-pointer text-[10px] font-medium transition hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Cancelling..." : "Cancel"}
      </button>
      {feedback ? <p className="oc-profile-meta max-w-[160px] text-right text-[11px] text-rose-300">{feedback}</p> : null}
    </div>
  );
}
