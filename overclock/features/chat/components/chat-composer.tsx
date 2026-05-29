"use client";

import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/chat/chat-constants";

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
  return (
    <div className="border-t border-white/[0.06] px-4 py-3.5 sm:px-5">
      <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-3">
        <textarea
          value={value}
          onChange={(event) => onBodyChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          disabled={disabled || isSending}
          rows={3}
          maxLength={MAX_CHAT_MESSAGE_LENGTH}
          placeholder="Send a message"
          className="w-full resize-none bg-transparent text-[13px] leading-6 text-zinc-100 outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:text-zinc-500"
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
