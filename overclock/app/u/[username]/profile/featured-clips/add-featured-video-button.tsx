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
      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-100 backdrop-blur-md transition-all duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
    >
      <PencilIcon className="h-3 w-3" />
    </button>
  );
}
