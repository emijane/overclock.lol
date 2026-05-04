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
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCheckedChange(nextValue: boolean) {
    const previousValue = hideOfflinePresence;

    setHideOfflinePresenceState(nextValue);
    setFeedback(null);

    startTransition(async () => {
      const result = await setHideOfflinePresence(nextValue);

      if (result.status === "success") {
        setHideOfflinePresenceState(result.hideOfflinePresence);
        setFeedback(
          result.hideOfflinePresence
            ? "You now appear offline to other users."
            : "Your presence is now visible to other users."
        );
        return;
      }

      setHideOfflinePresenceState(previousValue);

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
            Presence Privacy
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-zinc-50">
            Appear offline
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            When this is on, other signed-in users do not see your presence dot,
            even if you are online.
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            Current status:{" "}
            <span className="font-medium text-zinc-200">
              {hideOfflinePresence ? "Invisible to others" : "Presence visible"}
            </span>
          </p>
          {feedback ? <p className="mt-3 text-sm text-zinc-400">{feedback}</p> : null}
        </div>

        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-3 py-2">
          <span className="text-sm font-medium text-zinc-200">
            {isPending
              ? "Saving..."
              : hideOfflinePresence
                ? "Enabled"
                : "Disabled"}
          </span>
          <Switch
            checked={hideOfflinePresence}
            disabled={isPending}
            aria-label="Toggle appear offline"
            onCheckedChange={handleCheckedChange}
          />
        </div>
      </div>
    </section>
  );
}
