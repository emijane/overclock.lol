"use client";

import { useState } from "react";
import { Gamepad2Icon, TrophyIcon } from "lucide-react";

import {
  getLFGGameModeLabel,
  type LFGGameMode,
} from "@/lib/lfg/lfg-post-types";

const GAME_MODE_OPTIONS: Array<{
  description: string;
  icon: typeof TrophyIcon;
  value: LFGGameMode;
}> = [
  {
    description: "Use your competitive identity for comp queue.",
    icon: TrophyIcon,
    value: "ranked",
  },
  {
    description: "Use your competitive identity for casual queue.",
    icon: Gamepad2Icon,
    value: "quick_play",
  },
];

export function LFGGameModePicker() {
  const [selectedMode, setSelectedMode] = useState<LFGGameMode>("ranked");

  return (
    <div className="mt-4">
      <h2 className="text-sm font-semibold text-zinc-100">Choose a mode</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Your competitive profile still supplies the role, rank, region, and hero
        pool shown on the post.
      </p>
      <input type="hidden" name="game_mode" value={selectedMode} />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {GAME_MODE_OPTIONS.map((option) => {
          const isSelected = option.value === selectedMode;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedMode(option.value)}
              className={`rounded-[18px] border px-4 py-3 text-left transition ${
                isSelected
                  ? "border-sky-400/55 bg-sky-400/10 text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "border-zinc-800 bg-zinc-950/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">
                    {getLFGGameModeLabel(option.value)}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    {option.description}
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
