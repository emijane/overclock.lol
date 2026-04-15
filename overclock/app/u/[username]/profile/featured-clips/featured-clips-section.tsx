"use client";

import { useState, useTransition } from "react";

import { deleteFeaturedClip } from "@/app/u/[username]/actions";
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
  const [isPending, startTransition] = useTransition();

  if (!isOwner && clips.length === 0) {
    return null;
  }

  function openAddModal() {
    setSelectedClip(null);
    setModalKey((current) => current + 1);
    setIsModalOpen(true);
  }

  function openEditModal(clip: FeaturedClip) {
    setSelectedClip(clip);
    setModalKey((current) => current + 1);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setSelectedClip(null);
  }

  function handleDelete(clip: FeaturedClip) {
    startTransition(async () => {
      await deleteFeaturedClip(clip.id);
    });
  }

  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-zinc-50">
          Featured videos
        </h2>

        {isOwner && clips.length < 2 ? (
          <AddFeaturedVideoButton onClick={openAddModal} />
        ) : null}
      </div>

      {clips.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {clips.map((clip) => (
            <FeaturedClipCard
              key={clip.id}
              clip={clip}
              isOwner={isOwner}
              onDelete={isPending ? undefined : handleDelete}
              onEdit={openEditModal}
            />
          ))}
        </div>
      ) : null}

      <FeaturedVideoModal
        key={modalKey}
        clip={selectedClip}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </section>
  );
}
