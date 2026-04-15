"use client";

import type { ReactNode } from "react";
import { XIcon } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

type ProfileEditModalShellProps = {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
};

export function ProfileEditModalShell({
  isOpen,
  onClose,
  children,
}: ProfileEditModalShellProps) {
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
    <div
      className="fixed inset-0 z-[110] bg-zinc-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-modal-title"
          className="flex h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/40 sm:h-auto sm:max-h-[88vh] sm:rounded-[32px]"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex items-center justify-between gap-4 border-b border-zinc-800 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                Profile
              </p>
              <h2
                id="edit-profile-modal-title"
                className="mt-1 text-xl font-semibold tracking-[-0.03em] text-zinc-50"
              >
                Edit profile
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/80 text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-950"
              aria-label="Close edit profile modal"
            >
              <XIcon className="h-4.5 w-4.5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
            {children ?? (
              <div className="grid gap-4">
                <section className="rounded-[24px] border border-dashed border-zinc-800 bg-zinc-950/50 p-5 sm:p-6">
                  <h3 className="text-base font-semibold tracking-[-0.02em] text-zinc-100">
                    Modal shell ready
                  </h3>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-400">
                    This is the responsive template for the profile editor modal.
                    We can start moving fields into here next in small steps.
                  </p>
                </section>
              </div>
            )}
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-zinc-800 px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
            >
              Close
            </button>
            <button
              type="button"
              disabled
              className="rounded-full bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-500"
            >
              Save
            </button>
          </footer>
        </section>
      </div>
    </div>,
    document.body
  );
}
