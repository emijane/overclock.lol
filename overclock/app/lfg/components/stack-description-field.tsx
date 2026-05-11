"use client";

import { useState } from "react";

const MAX_CHARS = 300;

export function StackDescriptionField() {
  const [value, setValue] = useState("");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="stack-description" className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Description
          <span className="ml-2 font-normal normal-case tracking-normal text-zinc-700">
            optional
          </span>
        </label>
        <span className={`text-[11px] font-medium ${value.length > MAX_CHARS * 0.85 ? "text-amber-400" : "text-zinc-700"}`}>
          {value.length}/{MAX_CHARS}
        </span>
      </div>
      <textarea
        id="stack-description"
        name="description"
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX_CHARS))}
        placeholder="What are you looking for in teammates? Chill vibes, VOD review, climb together..."
        rows={3}
        maxLength={MAX_CHARS}
        className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-white/[0.12] focus:outline-none focus:ring-0"
      />
    </div>
  );
}
