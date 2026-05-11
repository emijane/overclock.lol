"use client";

import { useId, useState } from "react";

import { LFG_POST_TITLE_MAX_CHARACTERS } from "@/lib/lfg/lfg-post-types";

type PostTitleFieldProps = {
  placeholder?: string;
};

export function PostTitleField({
  placeholder = "Looking for hitscan duo for comp climb...",
}: PostTitleFieldProps) {
  const inputId = useId();
  const [value, setValue] = useState("");

  return (
    <div className="mt-3">
      <div className="rounded-[18px] border border-zinc-800 bg-zinc-950/90 px-3.5 pb-2 pt-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <label
          htmlFor={inputId}
          className="mb-1 block text-xs font-medium text-zinc-500"
        >
          Post title
        </label>
        <div className="flex items-center gap-3">
          <input
            id={inputId}
            type="text"
            required
            name="title"
            maxLength={LFG_POST_TITLE_MAX_CHARACTERS}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
            className="h-7 min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500"
          />
          <span className="shrink-0 text-xs text-zinc-600">
            {value.length}/{LFG_POST_TITLE_MAX_CHARACTERS}
          </span>
        </div>
      </div>
    </div>
  );
}
