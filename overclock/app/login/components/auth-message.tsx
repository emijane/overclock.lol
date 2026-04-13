"use client";

import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";

type AuthMessageProps = {
  message?: string;
  type?: string;
};

export function AuthMessage({ message, type }: AuthMessageProps) {
  const [isVisible, setIsVisible] = useState(Boolean(message));

  useEffect(() => {
    setIsVisible(Boolean(message));
  }, [message]);

  if (!message || !isVisible) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${
        type === "success"
          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
          : "border-rose-400/40 bg-rose-400/10 text-rose-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1">{message}</p>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="mt-[-2px] inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-current/75 transition hover:bg-black/10 hover:text-current"
          aria-label="Dismiss message"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
