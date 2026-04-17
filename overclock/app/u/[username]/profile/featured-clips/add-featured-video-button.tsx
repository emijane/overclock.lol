"use client";

import { PencilIcon } from "lucide-react";

type AddFeaturedVideoButtonProps = {
  onClick: () => void;
};

export function AddFeaturedVideoButton({
  onClick,
}: AddFeaturedVideoButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Manage featured videos"
      title="Manage featured videos"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.055] text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_28px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all duration-200 hover:border-sky-300/35 hover:bg-sky-300/10 hover:shadow-[0_0_24px_rgba(56,189,248,0.16),inset_0_1px_0_rgba(255,255,255,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
    >
      <PencilIcon className="h-4.5 w-4.5" />
    </button>
  );
}
