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
  const [isPending, startTransition] = useTransition();

  function handleCheckedChange(nextValue: boolean) {
    const previousValue = isLookingToPlay;
    setIsLookingToPlay(nextValue);

    startTransition(async () => {
      const result = await setLookingToPlay(nextValue);

      if (result.status !== "success") {
        setIsLookingToPlay(previousValue);
      } else {
        setIsLookingToPlay(result.isLookingToPlay);
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-zinc-100">Looking to play</p>
        <p className="mt-0.5 text-sm text-zinc-500">
          Let others know you&apos;re open to invites right now.
        </p>
      </div>
      <Switch
        checked={isLookingToPlay}
        disabled={isPending}
        aria-label="Toggle looking to play"
        onCheckedChange={handleCheckedChange}
      />
    </div>
  );
}
