"use client";

import { useFormStatus } from "react-dom";

export function ClosePostButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="inline-flex h-8 items-center rounded-full border border-white/10 bg-white/[0.025] px-3 text-xs font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.045] hover:text-zinc-50 disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/[0.02] disabled:text-zinc-500"
    >
      {pending ? "Closing..." : "Close Post"}
    </button>
  );
}
