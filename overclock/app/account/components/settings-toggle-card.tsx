"use client";

import { Switch } from "@/components/ui/switch";

type SettingsToggleCardProps = {
  ariaLabel: string;
  checked: boolean;
  description: string;
  disabled?: boolean;
  onCheckedChange: (nextValue: boolean) => void;
  title: string;
};

export function SettingsToggleCard({
  ariaLabel,
  checked,
  description,
  disabled = false,
  onCheckedChange,
  title,
}: SettingsToggleCardProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-zinc-100">{title}</p>
        <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
