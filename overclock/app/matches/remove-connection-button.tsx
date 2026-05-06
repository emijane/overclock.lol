"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { removeProfileConnection } from "@/app/matches/actions";

type RemoveConnectionButtonProps = {
  connectionId: string;
};

export function RemoveConnectionButton({
  connectionId,
}: RemoveConnectionButtonProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRemoveConnection() {
    setFeedback(null);

    startTransition(async () => {
      const result = await removeProfileConnection({ connectionId });

      if (result.status === "success") {
        router.refresh();
        return;
      }

      if (result.status === "unauthenticated") {
        setFeedback("Your session expired. Sign in again.");
        return;
      }

      if (result.status === "onboarding_required") {
        setFeedback("Finish onboarding before updating connections.");
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
        onClick={handleRemoveConnection}
        className="text-[11px] font-medium text-zinc-600 transition hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Removing..." : "Remove"}
      </button>
      {feedback ? (
        <p className="max-w-[160px] text-right text-[11px] text-rose-300">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
