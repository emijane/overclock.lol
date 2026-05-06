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
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={isPending}
        aria-disabled={isPending}
        onClick={handleCancel}
        className="inline-flex h-8 items-center rounded-full border border-white/10 bg-white/[0.025] px-3 text-xs font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.045] hover:text-zinc-50 disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/[0.02] disabled:text-zinc-500"
      >
        {isPending ? "Cancelling..." : "Cancel invite"}
      </button>
      {feedback ? <p className="text-xs text-rose-300">{feedback}</p> : null}
    </div>
  );
}
