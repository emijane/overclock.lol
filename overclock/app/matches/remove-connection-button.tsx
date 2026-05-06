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
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={isPending}
        aria-disabled={isPending}
        onClick={handleRemoveConnection}
        className="inline-flex h-8 items-center rounded-full border border-rose-400/20 bg-rose-500/10 px-3 text-[11px] font-semibold text-rose-100 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Removing..." : "Unmatch"}
      </button>
      {feedback ? (
        <p className="max-w-[180px] text-right text-[11px] text-rose-200">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
