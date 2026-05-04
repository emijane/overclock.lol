"use client";

import { useState, useTransition } from "react";

import { setLookingToPlay } from "@/app/account/actions";
import { Switch } from "@/components/ui/switch";

type AvailabilityToggleCardProps = {
  initialIsLookingToPlay: boolean;
};

export function AvailabilityToggleCard({
  initialIsLookingToPlay,
}: AvailabilityToggleCardProps) {
  const [isLookingToPlay, setIsLookingToPlay] = useState(initialIsLookingToPlay);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCheckedChange(nextValue: boolean) {
    const previousValue = isLookingToPlay;

    setIsLookingToPlay(nextValue);
    setFeedback(null);

    startTransition(async () => {
      const result = await setLookingToPlay(nextValue);

      if (result.status === "success") {
        setIsLookingToPlay(result.isLookingToPlay);
        setFeedback(
          result.isLookingToPlay
            ? "Looking to play is now on."
            : "Looking to play is now off."
        );
        return;
      }

      setIsLookingToPlay(previousValue);

      if (result.status === "unauthenticated") {
        setFeedback("Your session expired. Refresh and sign in again.");
        return;
      }

      setFeedback(result.message);
    });
  }

  return (
    <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-zinc-500">
            Availability
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-zinc-50">
            Looking to play
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Let people know you are open to invites right now. This is separate
            from automatic online presence.
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            Current status:{" "}
            <span className="font-medium text-zinc-200">
              {isLookingToPlay ? "On" : "Off"}
            </span>
          </p>
          {feedback ? (
            <p className="mt-3 text-sm text-zinc-400">{feedback}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-3 py-2">
          <span className="text-sm font-medium text-zinc-200">
            {isPending
              ? "Saving..."
              : isLookingToPlay
                ? "Enabled"
                : "Disabled"}
          </span>
          <Switch
            checked={isLookingToPlay}
            disabled={isPending}
            aria-label="Toggle looking to play"
            onCheckedChange={handleCheckedChange}
          />
        </div>
      </div>
    </section>
  );
}
