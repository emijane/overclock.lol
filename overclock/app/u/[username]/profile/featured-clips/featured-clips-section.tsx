"use client";

import { useState } from "react";
import { AddFeaturedVideoButton } from "./add-featured-video-button";
import { FeaturedClipCard } from "./featured-clip-card";
import { FeaturedVideoModal } from "./featured-video-modal";
import type { FeaturedClip } from "./types";
import { getRankPillColors } from "@/lib/competitive/rank-border-styles";

type FeaturedClipsSectionProps = {
  clips: FeaturedClip[];
  isOwner: boolean;
  rankTier?: string | null;
};

export function FeaturedClipsSection({
  clips,
  isOwner,
  rankTier,
}: FeaturedClipsSectionProps) {
  const rankColors = getRankPillColors(rankTier);
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
    <section className="border-t border-white/[0.04] px-5 py-3 sm:px-6 sm:py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="oc-profile-meta text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: rankColors.text, opacity: 0.6 }}>
            Featured videos
          </h2>
        </div>

        {isOwner ? (
          <AddFeaturedVideoButton onClick={openAddModal} />
        ) : null}
      </div>

      {clips.length > 0 ? (
        <div className="mt-3 grid gap-2.5 md:grid-cols-2">
          {clips.map((clip, index) => (
            <FeaturedClipCard key={clip.id} clip={clip} priority={index === 0} />
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-[10px] border border-white/[0.04] bg-white/[0.015] px-4 py-3 text-sm text-zinc-400">
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
