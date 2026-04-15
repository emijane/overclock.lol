"use client";

import { useState } from "react";

import { AddFeaturedVideoButton } from "./add-featured-video-button";
import { FeaturedClipCard } from "./featured-clip-card";
import { FeaturedVideoModal } from "./featured-video-modal";
import type { FeaturedClip } from "./types";

type FeaturedClipsSectionProps = {
  clips: FeaturedClip[];
  isOwner: boolean;
};

export function FeaturedClipsSection({
  clips,
  isOwner,
}: FeaturedClipsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!isOwner && clips.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-zinc-50">
          Featured videos
        </h2>

        {isOwner && clips.length < 2 ? (
          <AddFeaturedVideoButton onClick={() => setIsModalOpen(true)} />
        ) : null}
      </div>

      {clips.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {clips.map((clip) => (
            <FeaturedClipCard key={clip.id} clip={clip} isOwner={isOwner} />
          ))}
        </div>
      ) : null}

      <FeaturedVideoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}
