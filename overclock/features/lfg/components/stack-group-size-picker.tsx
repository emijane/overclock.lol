"use client";

import { useState } from "react";

const GROUP_SIZE_OPTIONS = [2, 3, 4, 5, 6] as const;

type StackGroupSizePickerProps = {
  defaultValue?: number | null;
};

export function StackGroupSizePicker({ defaultValue }: StackGroupSizePickerProps) {
  const [selected, setSelected] = useState<number | null>(defaultValue ?? null);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
        Group size
      </label>
      <div className="flex items-center gap-1.5">
        {GROUP_SIZE_OPTIONS.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => setSelected(selected === size ? null : size)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border text-[13px] font-semibold transition ${
              selected === size
                ? "border-white/15 bg-white/8 text-zinc-100"
                : "border-white/[0.07] bg-white/[0.03] text-zinc-500 hover:border-white/10 hover:bg-white/[0.06] hover:text-zinc-300"
            }`}
          >
            {size}
          </button>
        ))}
        <input type="hidden" name="max_group_size" value={selected ?? ""} />
        {selected ? (
          <span className="ml-1 text-[12px] text-zinc-600">
            {selected} players total
          </span>
        ) : (
          <span className="ml-1 text-[12px] text-zinc-700">any size</span>
        )}
      </div>
    </div>
  );
}
