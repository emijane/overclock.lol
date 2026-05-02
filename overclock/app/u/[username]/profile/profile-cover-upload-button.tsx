"use client";

import type { ChangeEvent } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { CameraIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";

import { uploadProfileCover } from "../actions";
import { createCroppedCoverFile } from "./profile-cover-crop";
import {
  PROFILE_COVER_ASPECT_RATIO,
  PROFILE_COVER_IMAGE_MAX_MB,
  PROFILE_MEDIA_IMAGE_ACCEPT_ATTRIBUTE,
} from "@/lib/profiles/profile-media";

export function ProfileCoverUploadButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [clientError, setClientError] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  function closeModal() {
    setClientError(null);
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
    setZoom(1);
    setImageSrc((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return null;
    });

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleOpenPicker() {
    if (isSubmitting) {
      return;
    }

    inputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setClientError(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setImageSrc((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return URL.createObjectURL(selectedFile);
    });
  }

  async function handleUpload() {
    if (!imageSrc || !croppedAreaPixels) {
      setClientError("Choose and position a cover image before uploading.");
      return;
    }

    setIsSubmitting(true);
    setClientError(null);

    let croppedFile: File;

    try {
      croppedFile = await createCroppedCoverFile(imageSrc, croppedAreaPixels);
    } catch (error) {
      setIsSubmitting(false);
      setClientError(
        error instanceof Error
          ? error.message
          : "Unable to prepare your cover image."
      );
      return;
    }

    const formData = new FormData();
    formData.set("cover_image", croppedFile);
    const result = await uploadProfileCover(formData);

    if (result.status === "error") {
      setIsSubmitting(false);
      setClientError(result.message);
      return;
    }

    closeModal();
    setIsSubmitting(false);
    const params = new URLSearchParams({
      type: "success",
      message: result.message,
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    router.refresh();
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        name="cover_image"
        accept={PROFILE_MEDIA_IMAGE_ACCEPT_ATTRIBUTE}
        className="sr-only"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={handleOpenPicker}
        disabled={isSubmitting}
        className="inline-flex h-7 items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/90 px-2.5 text-[11px] font-medium tracking-[-0.01em] text-zinc-100 shadow-sm shadow-black/30 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-950 disabled:cursor-wait disabled:opacity-70"
      >
        <CameraIcon className="h-3 w-3 shrink-0" />
        {isSubmitting ? "Uploading..." : "Update cover"}
      </button>

      {imageSrc && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 py-6">
          <div className="w-full max-w-3xl rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 shadow-2xl shadow-black/40 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-zinc-50">
                  Adjust cover photo
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Drag to reposition and use zoom to frame your cover.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="rounded-full border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>

            <div
              className="relative mt-5 overflow-hidden rounded-[24px] bg-zinc-950"
              style={{ aspectRatio: PROFILE_COVER_ASPECT_RATIO }}
            >
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={PROFILE_COVER_ASPECT_RATIO}
                onCropChange={setCrop}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                onZoomChange={setZoom}
                objectFit="cover"
              />
            </div>

            <div className="mt-5 grid gap-2">
              <label className="text-sm text-zinc-300" htmlFor="cover-zoom">
                Zoom
              </label>
              <input
                id="cover-zoom"
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-sky-400"
              />
              <p className="text-xs text-zinc-500">
                Processed as WebP. Original uploads can be up to {PROFILE_COVER_IMAGE_MAX_MB} MB.
              </p>
            </div>

            {clientError ? (
              <div className="mt-4 rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {clientError}
              </div>
            ) : null}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="rounded-full border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleUpload()}
                disabled={isSubmitting}
                className="rounded-full bg-sky-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                {isSubmitting ? "Uploading..." : "Save cover"}
              </button>
            </div>
          </div>
        </div>,
            document.body
          )
        : null}
    </>
  );
}
