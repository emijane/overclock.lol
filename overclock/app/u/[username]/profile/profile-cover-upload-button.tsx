"use client";

import { CameraIcon } from "lucide-react";
import { useRef, useState } from "react";

import { uploadProfileCover } from "../actions";
import { PROFILE_MEDIA_IMAGE_ACCEPT_ATTRIBUTE } from "@/lib/profiles/profile-media";

export function ProfileCoverUploadButton() {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenPicker() {
    if (isSubmitting) {
      return;
    }

    inputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files?.length) {
      return;
    }

    setIsSubmitting(true);
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={uploadProfileCover}>
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
        className="inline-flex items-center gap-2 rounded-full border border-zinc-700/80 bg-zinc-950/70 px-3.5 py-2 text-xs font-medium tracking-[-0.01em] text-zinc-100 backdrop-blur-sm transition hover:border-zinc-600 hover:bg-zinc-900/80 disabled:cursor-wait disabled:opacity-70"
      >
        <CameraIcon className="h-3.5 w-3.5 shrink-0" />
        {isSubmitting ? "Uploading..." : "Update cover"}
      </button>
    </form>
  );
}
