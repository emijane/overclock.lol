"use client";

import { useId, useState } from "react";

const MAX_POST_TITLE_LENGTH = 80;

export function PostTitleField() {
  const inputId = useId();
  const [value, setValue] = useState("");

  return (
    <div className="mt-4">
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm font-medium text-zinc-200"
      >
        Post title
      </label>
      <div className="rounded-[22px] border border-zinc-800 bg-zinc-950/90 px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex items-center gap-3">
          <input
            id={inputId}
            type="text"
            required
            name="title"
            maxLength={MAX_POST_TITLE_LENGTH}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Looking for hitscan duo for comp climb..."
            className="h-8 min-w-0 flex-1 bg-transparent text-[15px] text-zinc-100 outline-none transition placeholder:text-zinc-500"
          />
          <span className="shrink-0 text-xs text-zinc-600">
            {value.length}/{MAX_POST_TITLE_LENGTH}
          </span>
        </div>
      </div>
    </div>
  );
}
