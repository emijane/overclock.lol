"use client";

import { useLayoutEffect, useRef } from "react";

import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/chat/chat-constants";

const COMPOSER_MIN_HEIGHT_PX = 48;
const COMPOSER_MAX_HEIGHT_PX = 168;

export function ChatComposer({
  disabled,
  isSending,
  onBodyChange,
  onSubmit,
  value,
}: {
  disabled?: boolean;
  isSending: boolean;
  onBodyChange: (value: string) => void;
  onSubmit: () => void;
  value: string;
}) {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const textArea = textAreaRef.current;

    if (!textArea) {
      return;
    }

    textArea.style.height = "0px";

    const nextHeight = Math.min(
      Math.max(textArea.scrollHeight, COMPOSER_MIN_HEIGHT_PX),
      COMPOSER_MAX_HEIGHT_PX
    );

    textArea.style.height = `${nextHeight}px`;
    textArea.style.overflowY =
      textArea.scrollHeight > COMPOSER_MAX_HEIGHT_PX ? "auto" : "hidden";
  }, [value]);

  return (
    <div className="shrink-0 border-t border-white/[0.06] px-4 py-3 sm:px-5">
      <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-3">
        <textarea
          ref={textAreaRef}
          value={value}
          onChange={(event) => onBodyChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          disabled={disabled || isSending}
          maxLength={MAX_CHAT_MESSAGE_LENGTH}
          placeholder="Send a message"
          className="w-full resize-none bg-transparent text-[13px] leading-6 text-zinc-100 outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:text-zinc-500"
          style={{
            minHeight: `${COMPOSER_MIN_HEIGHT_PX}px`,
            maxHeight: `${COMPOSER_MAX_HEIGHT_PX}px`,
          }}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="oc-profile-meta text-[10px] text-zinc-500">
            {value.length}/{MAX_CHAT_MESSAGE_LENGTH}
          </p>
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled || isSending || value.trim().length === 0}
            className="oc-profile-display inline-flex h-9 items-center rounded-[10px] border border-white/[0.08] bg-white/[0.07] px-3.5 text-[12px] font-semibold text-zinc-100 transition hover:border-white/[0.12] hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
