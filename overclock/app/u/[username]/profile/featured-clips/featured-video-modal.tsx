"use client";

import { PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { FaYoutube } from "react-icons/fa";

import {
  deleteFeaturedClip,
  saveFeaturedClip,
  type SaveFeaturedClipResult,
} from "@/app/u/[username]/actions";
import {
  detectFeaturedClipPlatform,
  getYouTubeVideoId,
} from "@/lib/profiles/featured-clip-shared";

import type { FeaturedClip } from "./types";

type FeaturedVideoModalProps = {
  clip?: FeaturedClip | null;
  clips: FeaturedClip[];
  isOpen: boolean;
  onClose: () => void;
};

export function FeaturedVideoModal({
  clip = null,
  clips,
  isOpen,
  onClose,
}: FeaturedVideoModalProps) {
  const router = useRouter();
  const initialState: SaveFeaturedClipResult = {
    status: "idle",
    message: "",
  };
  const [formState, formAction] = useActionState(saveFeaturedClip, initialState);
  const [activeClip, setActiveClip] = useState<FeaturedClip | null>(clip);
  const [title, setTitle] = useState(clip?.title ?? "");
  const [url, setUrl] = useState(clip?.url ?? "");
  const [isDeletePending, startDeleteTransition] = useTransition();
  const detectedPlatform = useMemo(() => detectFeaturedClipPlatform(url), [url]);
  const videoId = useMemo(() => getYouTubeVideoId(url), [url]);
  const canAddAnotherVideo = clips.length < 2 || Boolean(activeClip);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && formState.status === "success" && formState.message) {
      router.refresh();
      onClose();
    }
  }, [formState.message, formState.status, isOpen, onClose, router]);

  function beginAddVideo() {
    setActiveClip(null);
    setTitle("");
    setUrl("");
  }

  function beginEditVideo(nextClip: FeaturedClip) {
    setActiveClip(nextClip);
    setTitle(nextClip.title ?? "");
    setUrl(nextClip.url);
  }

  function handleDelete(clipToDelete: FeaturedClip) {
    startDeleteTransition(async () => {
      const result = await deleteFeaturedClip(clipToDelete.id);

      if (result?.status === "success") {
        if (activeClip?.id === clipToDelete.id) {
          beginAddVideo();
        }
        router.refresh();
      }
    });
  }

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] bg-zinc-950/88" onClick={onClose}>
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="featured-video-modal-title"
          className="flex w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/40 sm:rounded-[28px]"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex items-center justify-between gap-4 border-b border-zinc-800 px-4 py-4 sm:px-5">
            <h2
              id="featured-video-modal-title"
              className="text-lg font-semibold tracking-[-0.02em] text-zinc-50"
            >
              Manage featured videos
            </h2>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close featured video modal"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/80 text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-950"
            >
              <XIcon className="h-4.5 w-4.5" />
            </button>
          </header>

          <div className="grid gap-5 px-4 py-5 sm:px-5">
            {clips.length > 0 ? (
              <section className="grid gap-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-zinc-200">Current videos</p>
                  {clips.length < 2 ? (
                    <button
                      type="button"
                      onClick={beginAddVideo}
                      className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      Add video
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  {clips.map((existingClip) => {
                    const isActive = activeClip?.id === existingClip.id;

                    return (
                      <div
                        key={existingClip.id}
                        className={`flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 ${
                          isActive
                            ? "border-sky-400/40 bg-sky-400/8"
                            : "border-zinc-800 bg-zinc-950/60"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-100">
                            {existingClip.title || "Featured video"}
                          </p>
                          <p className="truncate text-xs text-zinc-500">
                            {existingClip.url}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => beginEditVideo(existingClip)}
                            aria-label="Edit featured video"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/80 text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(existingClip)}
                            aria-label="Remove featured video"
                            disabled={isDeletePending}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/80 text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {canAddAnotherVideo ? (
              <form action={formAction} className="grid gap-4 border-t border-zinc-800 pt-5">
                <input type="hidden" name="clip_id" value={activeClip?.id ?? ""} />

                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-zinc-200">
                    {activeClip ? "Edit video" : "Add video"}
                  </p>
                  {activeClip ? (
                    <button
                      type="button"
                      onClick={beginAddVideo}
                      className="text-xs font-medium text-zinc-400 transition hover:text-zinc-200"
                    >
                      Add new instead
                    </button>
                  ) : null}
                </div>

                <label className="grid gap-1.5 text-sm text-zinc-300">
                  <span>YouTube URL</span>
                  <input
                    name="url"
                    type="text"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="Paste a YouTube watch, short, embed, or youtu.be URL"
                    className="h-11 rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 text-zinc-100 outline-none"
                  />
                </label>

                <label className="grid gap-1.5 text-sm text-zinc-300">
                  <span>Title</span>
                  <input
                    name="title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Optional title"
                    className="h-11 rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 text-zinc-100 outline-none"
                  />
                </label>

                <div className="min-h-8">
                  {detectedPlatform ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#FF0033]/40 bg-[#FF0033]/10 px-2.5 py-1 text-[11px] font-medium text-[#ff9aae]">
                      <FaYoutube className="h-3.5 w-3.5" />
                      YouTube
                    </span>
                  ) : url ? (
                    <p className="text-xs text-amber-300">
                      URL not recognized yet. Supported: YouTube watch links, shorts, embeds, and `youtu.be`.
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-500">
                      Paste a YouTube URL and we&apos;ll detect the video automatically.
                    </p>
                  )}
                </div>

                {videoId ? (
                  <p className="text-xs text-zinc-500">Video ID: {videoId}</p>
                ) : null}

                {formState.status === "error" && formState.message ? (
                  <p className="text-sm text-amber-300">{formState.message}</p>
                ) : null}

                <footer className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={!url.trim() || !detectedPlatform}
                    className="rounded-full bg-sky-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
                  >
                    Save
                  </button>
                </footer>
              </form>
            ) : null}

            {!canAddAnotherVideo ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-400">
                You already have two featured videos. Edit or remove one to make changes.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>,
    document.body
  );
}
