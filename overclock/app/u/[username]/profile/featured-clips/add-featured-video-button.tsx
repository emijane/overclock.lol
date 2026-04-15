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
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/80 text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-50"
    >
      <PencilIcon className="h-4.5 w-4.5" />
    </button>
  );
}
