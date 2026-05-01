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
  const [modalKey, setModalKey] = useState(0);
  const [selectedClip, setSelectedClip] = useState<FeaturedClip | null>(null);

  if (!isOwner && clips.length === 0) {
    return null;
  }

  function openAddModal() {
    setSelectedClip(null);
    setModalKey((current) => current + 1);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setSelectedClip(null);
  }

  return (
    <section className="border-t border-white/10 px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-white/85">
            Featured videos
          </h2>
        </div>

        {isOwner ? (
          <AddFeaturedVideoButton onClick={openAddModal} />
        ) : null}
      </div>

      {clips.length > 0 ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {clips.map((clip, index) => (
            <FeaturedClipCard key={clip.id} clip={clip} priority={index === 0} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[18px] border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-zinc-400">
          Add up to two featured videos to show them here.
        </div>
      )}

      <FeaturedVideoModal
        key={modalKey}
        clip={selectedClip}
        clips={clips}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </section>
  );
}
