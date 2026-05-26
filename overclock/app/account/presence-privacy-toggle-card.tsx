"use client";

import { useState, useTransition } from "react";

import { setHideOfflinePresence } from "@/app/account/actions";
import { SettingsToggleCard } from "@/app/account/components/settings-toggle-card";

type PresencePrivacyToggleCardProps = {
  initialHideOfflinePresence: boolean;
};

export function PresencePrivacyToggleCard({
  initialHideOfflinePresence,
}: PresencePrivacyToggleCardProps) {
  const [hideOfflinePresence, setHideOfflinePresenceState] = useState(
    initialHideOfflinePresence
  );
  const [isPending, startTransition] = useTransition();

  function handleCheckedChange(nextValue: boolean) {
    const previousValue = hideOfflinePresence;
    setHideOfflinePresenceState(nextValue);

    startTransition(async () => {
      const result = await setHideOfflinePresence(nextValue);

      if (result.status !== "success") {
        setHideOfflinePresenceState(previousValue);
      } else {
        setHideOfflinePresenceState(result.hideOfflinePresence);
      }
    });
  }

  return (
    <SettingsToggleCard
      ariaLabel="Toggle appear offline"
      checked={hideOfflinePresence}
      checkedLabel="Hidden"
      description="Hide your presence dot from other users."
      disabled={isPending}
      onCheckedChange={handleCheckedChange}
      title="Appear offline"
      uncheckedLabel="Visible"
    />
  );
}
