"use client";

import { PencilIcon, PlayIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { getYouTubeEmbedUrl } from "@/lib/profiles/featured-clip-shared";
import type { FeaturedClip } from "./types";

type FeaturedClipCardProps = {
  clip: FeaturedClip;
  isOwner?: boolean;
  onDelete?: (clip: FeaturedClip) => void;
  onEdit?: (clip: FeaturedClip) => void;
  priority?: boolean;
};

export function FeaturedClipCard({
  clip,
  isOwner = false,
  onDelete,
  onEdit,
  priority = false,
}: FeaturedClipCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const embedUrl = getYouTubeEmbedUrl(clip.url);

  return (
    <div
      className="group overflow-hidden rounded-[22px] border border-zinc-800 bg-zinc-950/80 transition hover:border-zinc-700"
    >
      <div className="relative aspect-video overflow-hidden bg-zinc-900">
        {isPlaying && embedUrl ? (
          <iframe
            src={`${embedUrl}?autoplay=1`}
            title={clip.title || "Featured YouTube video"}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <>
          {clip.thumbnailUrl ? (
            <Image
              src={clip.thumbnailUrl}
              alt={clip.title || "Featured YouTube thumbnail"}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
              loading={priority ? "eager" : "lazy"}
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/10" />
          <div className="absolute inset-x-4 top-4 z-20 flex items-start justify-end gap-3">
            {isOwner ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onEdit?.(clip);
                  }}
                  aria-label="Edit featured video"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-zinc-200 transition hover:border-white/20 hover:text-zinc-50"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onDelete?.(clip);
                  }}
                  aria-label="Remove featured video"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-zinc-200 transition hover:border-white/20 hover:text-zinc-50"
                >
                  <Trash2Icon className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            aria-label="Play featured video"
            className="absolute inset-0 z-10 flex items-center justify-center"
          >
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-black/45 text-zinc-100 transition group-hover:scale-105">
              <PlayIcon className="ml-0.5 h-5 w-5" />
            </span>
          </button>

          <div className="absolute inset-x-4 bottom-4 z-20">
            <p className="text-base font-semibold leading-6 text-zinc-100">
              {clip.title || "Featured video"}
            </p>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
