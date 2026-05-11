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
      className="group overflow-hidden rounded-[10px] border border-white/[0.07] bg-white/[0.025] shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_10px_22px_rgba(0,0,0,0.18)] transition-[border-color,background-color,transform] duration-150 hover:-translate-y-px hover:border-white/[0.11] hover:bg-white/[0.035]"
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
                className="object-cover transition-all duration-150 group-hover:scale-[1.01]"
                sizes="(min-width: 768px) 50vw, 100vw"
                loading={priority ? "eager" : "lazy"}
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/20 to-transparent" />

            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              aria-label="Play featured video"
              className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center transition-all duration-150"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-black/40 text-zinc-100 transition-all duration-150 group-hover:translate-y-[-1px]">
                <PlayIcon className="ml-0.5 h-4 w-4" />
              </span>
            </button>

            <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-4 pt-4">
              <p className="oc-profile-display text-[14px] font-medium leading-5 tracking-[-0.015em] text-white/90">
                {clip.title || "Featured video"}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
