"use client";

import { useState, useTransition } from "react";

import { setLookingToPlay } from "@/app/account/actions";
import { SettingsToggleCard } from "@/app/account/components/settings-toggle-card";

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
    <SettingsToggleCard
      ariaLabel="Toggle looking to play"
      checked={isLookingToPlay}
      checkedLabel="Visible"
      description="Let others know you&apos;re open to invites right now."
      disabled={isPending}
      onCheckedChange={handleCheckedChange}
      title="Looking to play"
      uncheckedLabel="Hidden"
    />
  );
}
