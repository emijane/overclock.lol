"use client";

import { useState, useTransition } from "react";

import { setHideOfflinePresence } from "@/app/account/actions";
import { Switch } from "@/components/ui/switch";

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
    <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-zinc-100">Appear offline</p>
        <p className="mt-0.5 text-sm text-zinc-500">
          Hide your presence dot from other users.
        </p>
      </div>
      <Switch
        checked={hideOfflinePresence}
        disabled={isPending}
        aria-label="Toggle appear offline"
        onCheckedChange={handleCheckedChange}
      />
    </div>
  );
}
