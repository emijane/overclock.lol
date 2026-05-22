"use client";

import Link from "next/link";
import { MoreHorizontalIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { AuthMessage } from "@/components/auth/auth-message";
import { closeLFGPost } from "@/features/lfg/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LFG_CARD_MENU_BUTTON_CLASS,
  LFG_CARD_MENU_CHILD_CLASS,
  LFG_CARD_MENU_CONTENT_CLASS,
  LFG_CARD_MENU_ITEM_CLASS,
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

function ClosePostMenuItem({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={LFG_CARD_MENU_BUTTON_CLASS}
    >
      {pending ? "Closing..." : label}
    </button>
  );
}

type LFGPostActionsMenuProps = {
  allowClose?: boolean;
  closeLabel?: string;
  copyLinkPath?: string;
  copyLinkLabel?: string;
  manageHref?: string;
  manageLabel?: string;
  postId: string;
  returnPath: string;
  viewHref?: string;
  viewLabel?: string;
};

export function LFGPostActionsMenu({
  allowClose = true,
  closeLabel = "Close Post",
  copyLinkPath,
  copyLinkLabel = "Copy stack link",
  manageHref = "/account/posts",
  manageLabel = "Manage My Posts",
  postId,
  returnPath,
  viewHref,
  viewLabel = "View Section",
}: LFGPostActionsMenuProps) {
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [messageType, setMessageType] = useState<"error" | "success">("success");

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeout = window.setTimeout(() => setMessage(undefined), 1800);
    return () => window.clearTimeout(timeout);
  }, [message]);

  async function handleCopyLink() {
    if (!copyLinkPath) {
      return;
    }

    try {
      const value = new URL(copyLinkPath, window.location.origin).toString();
      await copyText(value);
      setMessageType("success");
      setMessage("Stack link copied");
    } catch {
      setMessageType("error");
      setMessage("Unable to copy stack link");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Post actions"
            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[10px] text-zinc-500 transition hover:text-zinc-100"
          >
            <MoreHorizontalIcon className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className={LFG_CARD_MENU_CONTENT_CLASS}
        >
          {viewHref ? (
            <DropdownMenuItem
              asChild
              className={LFG_CARD_MENU_ITEM_CLASS}
            >
              <Link href={viewHref} className={LFG_CARD_MENU_CHILD_CLASS}>
                {viewLabel}
              </Link>
            </DropdownMenuItem>
          ) : null}
          {copyLinkPath ? (
              <DropdownMenuItem
              asChild
              className={LFG_CARD_MENU_ITEM_CLASS}
            >
              <button
                type="button"
                onClick={() => void handleCopyLink()}
                className={LFG_CARD_MENU_CHILD_CLASS}
              >
                {copyLinkLabel}
              </button>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            asChild
            className={LFG_CARD_MENU_ITEM_CLASS}
          >
            <Link href={manageHref} className={LFG_CARD_MENU_CHILD_CLASS}>
              {manageLabel}
            </Link>
          </DropdownMenuItem>
          {allowClose ? (
            <form action={closeLFGPost} className="w-full">
              <input type="hidden" name="post_id" value={postId} />
              <input type="hidden" name="return_path" value={returnPath} />
              <ClosePostMenuItem label={closeLabel} />
            </form>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <AuthMessage message={message} type={messageType} variant="toast" />
    </>
  );
}
