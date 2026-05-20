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
          className="flex w-full max-w-2xl flex-col overflow-hidden rounded-t-[14px] border border-white/[0.06] bg-[#111111] shadow-2xl shadow-black/40 sm:rounded-[14px]"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-4 py-4 sm:px-5">
            <h2
              id="featured-video-modal-title"
              className="oc-profile-display text-lg font-semibold tracking-[-0.03em] text-zinc-50"
            >
              Manage featured videos
            </h2>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close featured video modal"
              className="oc-profile-icon-button inline-flex h-9 w-9 items-center justify-center text-zinc-200"
            >
              <XIcon className="h-4.5 w-4.5" />
            </button>
          </header>

          <div className="grid gap-5 px-4 py-5 sm:px-5">
            {clips.length > 0 ? (
              <section className="grid gap-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="oc-profile-display text-sm font-medium text-zinc-200">Current videos</p>
                  {clips.length < 2 ? (
                    <button
                      type="button"
                      onClick={beginAddVideo}
                      className="oc-profile-display oc-profile-text-button inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-300"
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
                        className={`flex items-center justify-between gap-3 overflow-hidden rounded-[12px] border px-3.5 py-3 ${
                          isActive
                            ? "border-sky-400/40 bg-sky-400/8"
                            : "border-white/[0.06] bg-[#090909]"
                        }`}
                      >
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="oc-profile-display truncate text-sm font-medium text-zinc-100">
                            {existingClip.title || "Featured video"}
                          </p>
                          <p className="oc-profile-meta truncate text-xs text-zinc-500">
                            {existingClip.url}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => beginEditVideo(existingClip)}
                            aria-label="Edit featured video"
                            className="oc-profile-icon-button inline-flex h-9 w-9 items-center justify-center text-zinc-300"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(existingClip)}
                            aria-label="Remove featured video"
                            disabled={isDeletePending}
                            className="oc-profile-icon-button inline-flex h-9 w-9 items-center justify-center text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
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
              <form action={formAction} className="grid gap-4 border-t border-white/[0.06] pt-5">
                <input type="hidden" name="clip_id" value={activeClip?.id ?? ""} />

                <div className="flex items-center justify-between gap-3">
                  <p className="oc-profile-display text-sm font-medium text-zinc-200">
                    {activeClip ? "Edit video" : "Add video"}
                  </p>
                  {activeClip ? (
                    <button
                      type="button"
                      onClick={beginAddVideo}
                      className="oc-profile-meta text-xs font-medium transition hover:text-zinc-200"
                    >
                      Add new instead
                    </button>
                  ) : null}
                </div>

                <label className="grid gap-1.5 text-sm text-zinc-300">
                  <span className="oc-profile-meta text-[11px] font-medium uppercase tracking-[0.08em]">YouTube URL</span>
                  <input
                    name="url"
                    type="text"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="Paste a YouTube watch, short, embed, or youtu.be URL"
                    className="h-11 rounded-[12px] border border-white/[0.06] bg-[#090909] px-3.5 text-zinc-100 outline-none transition focus:border-white/[0.12]"
                  />
                </label>

                <label className="grid gap-1.5 text-sm text-zinc-300">
                  <span className="oc-profile-meta text-[11px] font-medium uppercase tracking-[0.08em]">Title</span>
                  <input
                    name="title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Optional title"
                    className="h-11 rounded-[12px] border border-white/[0.06] bg-[#090909] px-3.5 text-zinc-100 outline-none transition focus:border-white/[0.12]"
                  />
                </label>

                <div className="min-h-8">
                  {detectedPlatform ? (
                    <span className="oc-profile-meta inline-flex items-center gap-2 rounded-full border border-[#FF0033]/40 bg-[#FF0033]/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#ff9aae]">
                      <FaYoutube className="h-3.5 w-3.5" />
                      YouTube
                    </span>
                  ) : url ? (
                    <p className="oc-profile-meta text-xs text-amber-300">
                      URL not recognized yet. Supported: YouTube watch links, shorts, embeds, and `youtu.be`.
                    </p>
                  ) : (
                    <p className="oc-profile-meta text-xs">
                      Paste a YouTube URL and we&apos;ll detect the video automatically.
                    </p>
                  )}
                </div>

                {videoId ? (
                  <p className="oc-profile-meta text-xs">Video ID: {videoId}</p>
                ) : null}

                {formState.status === "error" && formState.message ? (
                  <p className="oc-profile-meta text-sm text-amber-300">{formState.message}</p>
                ) : null}

                <footer className="flex items-center justify-end gap-3 border-t border-white/[0.06] pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="oc-profile-display oc-profile-text-button px-4 py-2.5 text-sm font-medium text-zinc-300"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={!url.trim() || !detectedPlatform}
                    className="oc-profile-display rounded-[10px] bg-sky-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
                  >
                    Save
                  </button>
                </footer>
              </form>
            ) : null}

            {!canAddAnotherVideo ? (
              <div className="rounded-[12px] border border-white/[0.06] bg-[#090909] px-4 py-3 text-sm text-zinc-400">
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
