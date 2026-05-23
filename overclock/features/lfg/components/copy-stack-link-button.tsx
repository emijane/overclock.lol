"use client";

import { Link2Icon } from "lucide-react";
import { useEffect, useState } from "react";

import { AuthMessage } from "@/components/auth/auth-message";

type CopyStackLinkButtonProps = {
  path: string;
};

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

export function CopyStackLinkButton({ path }: CopyStackLinkButtonProps) {
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [messageType, setMessageType] = useState<"error" | "success">("success");

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeout = window.setTimeout(() => setMessage(undefined), 1800);
    return () => window.clearTimeout(timeout);
  }, [message]);

  async function handleCopy() {
    try {
      const value = new URL(path, window.location.origin).toString();
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
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="oc-profile-display inline-flex h-7 items-center gap-1.25 rounded-[10px] border border-white/8 bg-black/55 px-2.5 text-[10px] font-semibold text-zinc-200 backdrop-blur-sm transition hover:border-white/12 hover:bg-black/70 hover:text-zinc-50"
      >
        <Link2Icon className="h-3.25 w-3.25 shrink-0" />
        Copy stack link
      </button>
      <AuthMessage message={message} type={messageType} variant="toast" />
    </>
  );
}
