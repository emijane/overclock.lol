"use client";

import { XIcon } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import { updateProfile } from "@/app/account/actions";

import { ProfileEditFormFields } from "./profile-edit-form-fields";
import type { ProfileEditProfile } from "./profile-edit-types";
import { useProfileEditForm } from "./use-profile-edit-form";

type ProfileEditModalShellProps = {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileEditProfile;
};

export function ProfileEditModalShell({
  isOpen,
  onClose,
  profile,
}: ProfileEditModalShellProps) {
  const form = useProfileEditForm(profile);

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

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[110] bg-zinc-950/88" onClick={onClose}>
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-modal-title"
          className="flex h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border border-white/8 bg-[#05070b] shadow-[0_24px_70px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] sm:h-auto sm:max-h-[88vh] sm:rounded-[32px]"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex items-center justify-between gap-4 border-b border-white/6 px-4 py-4 sm:px-6">
            <h2
              id="edit-profile-modal-title"
              className="text-xl font-semibold tracking-[-0.045em] text-zinc-50"
            >
              Edit profile
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10"
              aria-label="Close edit profile modal"
            >
              <XIcon className="h-4.5 w-4.5" />
            </button>
          </header>

          <form action={updateProfile} className="flex min-h-0 flex-1 flex-col">
            <input type="hidden" name="return_to" value={profile.returnTo} />
            {profile.lookingFor.map((option) => (
              <input key={option} type="hidden" name="looking_for" value={option} />
            ))}
            <input type="hidden" name="twitch_url" value={form.twitchUrl} />
            <input type="hidden" name="x_url" value={form.xUrl} />
            <input type="hidden" name="youtube_url" value={form.youtubeUrl} />

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
              <ProfileEditFormFields form={form} profile={profile} />
            </div>

            <footer className="flex items-center justify-end gap-3 border-t border-white/6 px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 items-center rounded-full border border-white/10 bg-white/5 px-4 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-zinc-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-full bg-sky-400 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300"
              >
                Save
              </button>
            </footer>
          </form>
        </section>
      </div>
    </div>,
    document.body
  );
}
