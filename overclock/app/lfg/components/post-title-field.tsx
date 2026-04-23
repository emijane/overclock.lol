"use client";

import { useId, useState } from "react";

const MAX_POST_TITLE_LENGTH = 80;

export function PostTitleField() {
  const inputId = useId();
  const [value, setValue] = useState("");

  return (
    <div className="mt-4">
      <div className="rounded-[22px] border border-zinc-800 bg-zinc-950/90 px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-semibold tracking-[-0.01em] text-zinc-100"
        >
          What are you looking for?
        </label>
        <input
          id={inputId}
          type="text"
          maxLength={MAX_POST_TITLE_LENGTH}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Looking for chill Mercy duo for comp climb..."
          className="h-8 w-full bg-transparent text-[15px] text-zinc-100 outline-none transition placeholder:text-zinc-500"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
          <span>Keep it short and specific.</span>
          <span>
            {value.length}/{MAX_POST_TITLE_LENGTH}
          </span>
        </div>
      </div>
    </div>
  );
}
