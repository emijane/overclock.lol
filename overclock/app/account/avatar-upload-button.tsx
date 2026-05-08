"use client";

import type { ChangeEvent } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { CameraIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

import { uploadProfileAvatar } from "@/app/account/actions";
import { createCroppedAvatarFile } from "@/app/account/avatar-crop";
import {
  PROFILE_AVATAR_MAX_MB,
  PROFILE_MEDIA_IMAGE_ACCEPT_ATTRIBUTE,
} from "@/lib/profiles/profile-media";

type AvatarUploadButtonProps = {
  avatarUrl: string | null;
  initial: string;
};

export function AvatarUploadButton({ avatarUrl, initial }: AvatarUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
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

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setClientError(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setImageSrc((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return URL.createObjectURL(file);
    });
  }

  async function handleUpload() {
    if (!imageSrc || !croppedAreaPixels) {
      setClientError("Choose and position an image before uploading.");
      return;
    }

    setIsSubmitting(true);
    setClientError(null);

    let croppedFile: File;

    try {
      croppedFile = await createCroppedAvatarFile(imageSrc, croppedAreaPixels);
    } catch (error) {
      setIsSubmitting(false);
      setClientError(
        error instanceof Error ? error.message : "Unable to prepare your avatar."
      );
      return;
    }

    const formData = new FormData();
    formData.set("avatar_image", croppedFile);
    const result = await uploadProfileAvatar(formData);

    if (result.status === "error") {
      setIsSubmitting(false);
      setClientError(result.message);
      return;
    }

    closeModal();
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={PROFILE_MEDIA_IMAGE_ACCEPT_ATTRIBUTE}
        className="sr-only"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => !isSubmitting && inputRef.current?.click()}
        className="group relative h-full w-full"
        aria-label="Upload profile picture"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-base font-semibold text-zinc-100">
            {initial}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100">
          <CameraIcon className="h-5 w-5 text-white" />
        </div>
      </button>

      {imageSrc && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 py-6">
              <div className="w-full max-w-sm rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 shadow-2xl shadow-black/40">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold tracking-[-0.03em] text-zinc-50">
                      Adjust profile photo
                    </h2>
                    <p className="mt-1 text-sm text-zinc-400">
                      Drag to reposition and zoom to frame.
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
                  className="relative mt-5 overflow-hidden rounded-full bg-zinc-950"
                  style={{ aspectRatio: "1 / 1" }}
                >
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    onCropChange={setCrop}
                    onCropComplete={(_, areaPixels) =>
                      setCroppedAreaPixels(areaPixels)
                    }
                    onZoomChange={setZoom}
                    objectFit="cover"
                  />
                </div>

                <div className="mt-5 grid gap-2">
                  <label className="text-sm text-zinc-300" htmlFor="avatar-zoom">
                    Zoom
                  </label>
                  <input
                    id="avatar-zoom"
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-sky-400"
                  />
                  <p className="text-xs text-zinc-500">
                    Processed as WebP. Original uploads can be up to {PROFILE_AVATAR_MAX_MB} MB.
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
                    {isSubmitting ? "Uploading..." : "Save photo"}
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
