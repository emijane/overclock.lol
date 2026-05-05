"use client";

import { useState } from "react";
import { Gamepad2Icon, TrophyIcon } from "lucide-react";

import {
  getLFGGameModeLabel,
  type LFGGameMode,
} from "@/lib/lfg/lfg-post-types";

const GAME_MODE_OPTIONS: Array<{
  icon: typeof TrophyIcon;
  value: LFGGameMode;
}> = [
  {
    icon: TrophyIcon,
    value: "ranked",
  },
  {
    icon: Gamepad2Icon,
    value: "quick_play",
  },
];

export function LFGGameModePicker() {
  const [selectedMode, setSelectedMode] = useState<LFGGameMode>("ranked");

  return (
    <div className="mt-3">
      <h2 className="text-sm font-semibold text-zinc-100">Queue</h2>
      <input type="hidden" name="game_mode" value={selectedMode} />
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {GAME_MODE_OPTIONS.map((option) => {
          const isSelected = option.value === selectedMode;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedMode(option.value)}
              className={`rounded-[16px] border px-3.5 py-2 text-left transition ${
                isSelected
                  ? "border-white/20 bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "border-zinc-800 bg-zinc-950/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.03]">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-h-7 flex items-center">
                  <p className="text-sm font-semibold leading-5">
                    {getLFGGameModeLabel(option.value)}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
