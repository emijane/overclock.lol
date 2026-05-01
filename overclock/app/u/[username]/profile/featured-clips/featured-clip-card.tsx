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
      className="group overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.04] transition-all duration-200 hover:bg-white/[0.06]"
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/12 to-transparent" />

            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              aria-label="Play featured video"
              className="absolute inset-0 z-10 flex items-center justify-center transition-all duration-200"
            >
              <span className="inline-flex h-15 w-15 items-center justify-center rounded-full border border-white/12 bg-black/50 text-zinc-100 shadow-[0_12px_28px_rgba(0,0,0,0.35)] transition group-hover:scale-105 group-hover:bg-black/58">
                <PlayIcon className="ml-0.5 h-5.5 w-5.5" />
              </span>
            </button>

            <div className="absolute inset-x-5 bottom-5 z-20">
              <p className="text-base font-semibold leading-6 tracking-[-0.015em] text-zinc-100">
                {clip.title || "Featured video"}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
