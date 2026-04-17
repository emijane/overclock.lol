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
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white/[0.055] text-zinc-100 shadow-[0_0_18px_var(--profile-rank-glow),inset_0_1px_0_rgba(255,255,255,0.1),0_10px_28px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all duration-200 [border-color:var(--profile-rank-border)] hover:bg-white/[0.075] hover:shadow-[0_0_24px_var(--profile-rank-glow),inset_0_1px_0_rgba(255,255,255,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
    >
      <PencilIcon className="h-4.5 w-4.5" />
    </button>
  );
}
