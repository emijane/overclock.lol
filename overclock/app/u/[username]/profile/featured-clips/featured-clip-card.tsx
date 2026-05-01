"use client";

import { PlayIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { getYouTubeEmbedUrl } from "@/lib/profiles/featured-clip-shared";
import type { FeaturedClip } from "./types";

type FeaturedClipCardProps = {
  clip: FeaturedClip;
  priority?: boolean;
};

export function FeaturedClipCard({
  clip,
  priority = false,
}: FeaturedClipCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const embedUrl = getYouTubeEmbedUrl(clip.url);

  return (
    <div
      className="group overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.02] transition-all duration-200 hover:border-white/20"
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
                className="object-cover transition-all duration-200 group-hover:scale-[1.02]"
                sizes="(min-width: 768px) 50vw, 100vw"
                loading={priority ? "eager" : "lazy"}
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/24 to-transparent" />

            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              aria-label="Play featured video"
              className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center transition-all duration-200"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/35 text-zinc-100 backdrop-blur-sm transition-all duration-200 group-hover:scale-105">
                <PlayIcon className="ml-0.5 h-4 w-4" />
              </span>
            </button>

            <div className="absolute inset-x-5 bottom-0 z-20 px-5 pb-6 pt-5">
              <p className="text-sm font-medium leading-5 tracking-[-0.015em] text-white/90">
                {clip.title || "Featured video"}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
