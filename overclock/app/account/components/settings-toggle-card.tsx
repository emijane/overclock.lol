"use client";

import { Switch } from "@/components/ui/switch";

type SettingsToggleCardProps = {
  ariaLabel: string;
  checked: boolean;
  checkedLabel?: string;
  description: string;
  disabled?: boolean;
  onCheckedChange: (nextValue: boolean) => void;
  title: string;
  uncheckedLabel?: string;
};

export function SettingsToggleCard({
  ariaLabel,
  checked,
  checkedLabel = "On",
  description,
  disabled = false,
  onCheckedChange,
  title,
  uncheckedLabel = "Off",
}: SettingsToggleCardProps) {
  return (
    <div className="oc-list-row-hover flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="oc-profile-display text-[14px] font-semibold tracking-[-0.02em] text-zinc-100">
            {title}
          </p>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${
              checked
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                : "border-white/[0.06] bg-white/[0.04] text-zinc-500"
            }`}
          >
            {checked ? checkedLabel : uncheckedLabel}
          </span>
        </div>
        <p className="mt-1 text-[13px] leading-6 text-zinc-500">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="oc-profile-meta hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:inline">
          {checked ? checkedLabel : uncheckedLabel}
        </span>
        <Switch
          checked={checked}
          disabled={disabled}
          aria-label={ariaLabel}
          onCheckedChange={onCheckedChange}
        />
      </div>
    </div>
  );
}
