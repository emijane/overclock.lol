"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { removeProfileConnection } from "@/features/matches/actions";

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
        className="oc-profile-meta inline-flex h-8 items-center rounded-full border border-white/8 bg-white/[0.03] px-3 text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-300 transition hover:border-white/12 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Removing..." : "Remove"}
      </button>
      {feedback ? (
        <p className="oc-profile-meta max-w-[160px] text-right text-[11px] text-rose-300">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
