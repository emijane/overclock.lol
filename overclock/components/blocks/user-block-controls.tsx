"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontalIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { blockUser, unblockUser } from "@/features/blocks/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LFG_CARD_MENU_CONTENT_CLASS,
  LFG_CARD_MENU_ITEM_CLASS,
  LFG_CARD_MENU_SEPARATOR_CLASS,
} from "@/components/lfg/lfg-card-menu-styles";

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

type ActionToastProps = {
  message: string | null;
  onDismiss: () => void;
};

type BlockConfirmationModalProps = {
  isOpen: boolean;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  targetName: string;
};

type UserBlockMenuProps = {
  align?: "center" | "end" | "start";
  blocked?: boolean;
  compactCardMenu?: boolean;
  copyLinkPath?: string;
  initiallyBlocked?: boolean;
  isPending?: boolean;
  onBlockedChange?: (nextBlocked: boolean) => void;
  targetDisplayName?: string | null;
  targetProfileId: string;
  targetUsername?: string | null;
  triggerClassName?: string;
  triggerLabel?: string;
  viewProfileHref?: string | null;
};

type UnblockUserButtonProps = {
  initiallyBlocked?: boolean;
  targetDisplayName?: string | null;
  targetProfileId: string;
};

function ActionToast({ message, onDismiss }: ActionToastProps) {
  useEffect(() => {
    if (!message) {
      return;
    }

    const timeout = window.setTimeout(onDismiss, 2200);
    return () => window.clearTimeout(timeout);
  }, [message, onDismiss]);

  if (!message) {
    return null;
  }

  return (
    <div className="oc-surface-toast fixed right-4 top-[4.75rem] z-[130] w-[min(300px,calc(100vw-2rem))] rounded-[12px] px-3 py-2 text-xs text-zinc-100 backdrop-blur-sm sm:right-6 sm:top-[5.25rem]">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 flex-1 leading-5">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[10px] text-zinc-400 transition hover:bg-white/8 hover:text-zinc-100"
          aria-label="Dismiss message"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function BlockConfirmationModal({
  isOpen,
  isPending,
  onCancel,
  onConfirm,
  targetName,
}: BlockConfirmationModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, isPending, onCancel]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[125] bg-black/78 backdrop-blur-[2px]" onClick={isPending ? undefined : onCancel}>
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="block-user-modal-title"
          className="oc-surface-elevated w-full max-w-[30rem] overflow-hidden rounded-t-[18px] sm:rounded-[12px]"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-4 py-3.5 sm:px-4.5">
            <div>
              <p className="oc-profile-meta text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Safety
              </p>
              <h2
                id="block-user-modal-title"
                className="oc-profile-display mt-1 text-[14px] font-semibold tracking-[-0.03em] text-zinc-50"
              >
                Block user?
              </h2>
            </div>

            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="oc-profile-icon-button inline-flex h-9 w-9 items-center justify-center text-zinc-300 transition hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Close block confirmation"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </header>

          <div className="px-4 py-5 sm:px-4.5">
            <p className="text-[14px] leading-7 tracking-[-0.015em] text-zinc-300">
              {targetName}
              {" "}
              won&apos;t be able to send you invites or requests, and their
              profile and search results will be hidden from your account.
            </p>
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-4 py-3.5 sm:px-4.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="oc-profile-display inline-flex h-8 cursor-pointer items-center rounded-[10px] border border-white/[0.08] bg-white/[0.03] px-4 text-[13px] font-semibold text-zinc-300 transition hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="oc-profile-display inline-flex h-8 cursor-pointer items-center rounded-[10px] border border-rose-400/22 bg-rose-500/[0.12] px-4 text-[13px] font-semibold text-rose-100 transition hover:border-rose-400/30 hover:bg-rose-500/[0.18] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Blocking..." : "Block user"}
            </button>
          </footer>
        </section>
      </div>
    </div>,
    document.body
  );
}

function useUserBlockAction(initiallyBlocked: boolean) {
  const router = useRouter();
  const [isBlocked, setIsBlocked] = useState(initiallyBlocked);
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function runAction(targetProfileId: string, nextBlockedState: boolean) {
    startTransition(async () => {
      const result = nextBlockedState
        ? await blockUser(targetProfileId)
        : await unblockUser(targetProfileId);

      setToastMessage(result.message);

      if (result.ok) {
        setIsBlocked(nextBlockedState);
      }

      router.refresh();
    });
  }

  return {
    isBlocked,
    isPending,
    runAction,
    setToastMessage,
    toastMessage,
  };
}

export function UserBlockMenu({
  align = "end",
  blocked,
  compactCardMenu = false,
  copyLinkPath,
  initiallyBlocked = false,
  isPending: controlledPending,
  onBlockedChange,
  targetDisplayName,
  targetProfileId,
  targetUsername,
  triggerClassName,
  triggerLabel = "User actions",
  viewProfileHref,
}: UserBlockMenuProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [copyToastMessage, setCopyToastMessage] = useState<string | null>(null);
  const { isBlocked, isPending, runAction, setToastMessage, toastMessage } =
    useUserBlockAction(initiallyBlocked);
  const resolvedBlocked = blocked ?? isBlocked;
  const resolvedPending = controlledPending ?? isPending;
  const targetName = targetUsername
    ? `@${targetUsername}`
    : targetDisplayName ?? "This user";
  const activeToastMessage = copyToastMessage ?? toastMessage;

  const resolvedTriggerClassName =
    triggerClassName ??
    "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[10px] text-zinc-500 transition hover:text-zinc-100";
  const contentClassName = compactCardMenu
    ? LFG_CARD_MENU_CONTENT_CLASS
    : "w-40 rounded-[14px] border border-white/[0.08] bg-[#111111] p-1 text-zinc-100 shadow-[0_18px_44px_rgba(0,0,0,0.35)]";
  const itemClassName = compactCardMenu
    ? LFG_CARD_MENU_ITEM_CLASS
    : "text-zinc-300 focus:bg-white/[0.04] focus:text-zinc-50";
  const separatorClassName = compactCardMenu
    ? LFG_CARD_MENU_SEPARATOR_CLASS
    : "my-1 bg-white/[0.06]";

  async function handleCopyLink() {
    if (!copyLinkPath) {
      return;
    }

    try {
      const value = new URL(copyLinkPath, window.location.origin).toString();
      await copyText(value);
      setCopyToastMessage("Stack link copied");
    } catch {
      setCopyToastMessage("Unable to copy stack link");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={triggerLabel}
            className={resolvedTriggerClassName}
          >
            <MoreHorizontalIcon className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          className={contentClassName}
        >
          {viewProfileHref ? (
            <>
              <DropdownMenuItem asChild className={itemClassName}>
                <Link href={viewProfileHref}>View profile</Link>
              </DropdownMenuItem>
              {copyLinkPath ? (
                <DropdownMenuItem
                  className={itemClassName}
                  onSelect={(event) => {
                    event.preventDefault();
                    void handleCopyLink();
                  }}
                >
                  Copy stack link
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator className={separatorClassName} />
            </>
          ) : copyLinkPath ? (
            <>
              <DropdownMenuItem
                className={itemClassName}
                onSelect={(event) => {
                  event.preventDefault();
                  void handleCopyLink();
                }}
              >
                Copy stack link
              </DropdownMenuItem>
              <DropdownMenuSeparator className={separatorClassName} />
            </>
          ) : null}
          <DropdownMenuItem
            disabled={resolvedPending}
            className={itemClassName}
            onSelect={(event) => {
              event.preventDefault();

              if (resolvedBlocked) {
                if (onBlockedChange) {
                  onBlockedChange(false);
                  return;
                }

                runAction(targetProfileId, false);
                return;
              }

              setIsConfirmOpen(true);
            }}
          >
            {resolvedBlocked ? "Unblock user" : "Block user"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BlockConfirmationModal
        isOpen={isConfirmOpen}
        isPending={resolvedPending}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          if (onBlockedChange) {
            onBlockedChange(true);
          } else {
            runAction(targetProfileId, true);
          }
          setIsConfirmOpen(false);
        }}
        targetName={targetName}
      />

      <ActionToast
        message={activeToastMessage}
        onDismiss={() => {
          setCopyToastMessage(null);
          setToastMessage(null);
        }}
      />
    </>
  );
}

export function UnblockUserButton({
  initiallyBlocked = true,
  targetDisplayName,
  targetProfileId,
}: UnblockUserButtonProps) {
  const { isBlocked, isPending, runAction, setToastMessage, toastMessage } =
    useUserBlockAction(initiallyBlocked);

  if (!isBlocked) {
    return <ActionToast message={toastMessage} onDismiss={() => setToastMessage(null)} />;
  }

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => runAction(targetProfileId, false)}
        className="oc-profile-display inline-flex h-7 items-center rounded-[10px] border border-white/[0.06] bg-white/[0.03] px-3 text-[11px] font-semibold text-zinc-300 transition hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={`Unblock ${targetDisplayName ?? "user"}`}
      >
        {isPending ? "Unblocking..." : "Unblock"}
      </button>
      <ActionToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </>
  );
}
