"use client";

import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";

type AuthMessageProps = {
  message?: string;
  variant?: "inline" | "toast";
  type?: string;
};

export function AuthMessage({
  message,
  variant = "inline",
  type,
}: AuthMessageProps) {
  const [isVisible, setIsVisible] = useState(Boolean(message));

  useEffect(() => {
    setIsVisible(Boolean(message));
  }, [message]);

  if (!message || !isVisible) {
    return null;
  }

  const toneClassName =
    type === "success"
      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
      : "border-rose-400/40 bg-rose-400/10 text-rose-100";
  const containerClassName =
    variant === "toast"
      ? "fixed right-4 top-[4.75rem] z-50 w-[min(320px,calc(100vw-2rem))] rounded-[14px] border px-3 py-1.5 text-xs shadow-[0_14px_36px_rgba(0,0,0,0.34)] backdrop-blur-sm sm:right-6 sm:top-[5.25rem]"
      : "mb-5 rounded-[18px] border px-4 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-4.5";

  return (
    <div className={`${containerClassName} ${toneClassName}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 flex-1 leading-5">{message}</p>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-current/75 transition hover:bg-black/10 hover:text-current"
          aria-label="Dismiss message"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
