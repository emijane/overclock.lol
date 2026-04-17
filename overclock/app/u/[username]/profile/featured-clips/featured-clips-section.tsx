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
    <section className="border-t border-white/10 px-5 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-zinc-50">
            Featured videos
          </h2>
          <p className="mt-0.5 text-sm leading-5 text-zinc-400">
            Clips and highlights worth showing first.
          </p>
        </div>

        {isOwner ? (
          <AddFeaturedVideoButton onClick={openAddModal} />
        ) : null}
      </div>

      {clips.length > 0 ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {clips.map((clip, index) => (
            <FeaturedClipCard key={clip.id} clip={clip} priority={index === 0} />
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-[18px] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-zinc-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
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
