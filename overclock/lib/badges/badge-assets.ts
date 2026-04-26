import { CrownIcon, ShieldCheckIcon, type LucideIcon } from "lucide-react";

type BadgePreset = {
  Icon: LucideIcon;
  iconClassName: string;
  lfgClassName: string;
  profileClassName: string;
};

const BADGE_PRESET_BY_SLUG: Record<string, BadgePreset> = {
  "founder-badge": {
    Icon: CrownIcon,
    iconClassName: "text-amber-300",
    lfgClassName:
      "h-5 border-amber-300/14 bg-amber-300/[0.08] px-2 text-[9px] font-medium uppercase tracking-[0.1em] text-amber-100/85",
    profileClassName:
      "h-7 border-amber-300/20 bg-amber-300/10 px-3 text-[11px] font-medium text-amber-100",
  },
  "staff-badge": {
    Icon: ShieldCheckIcon,
    iconClassName: "text-sky-300",
    lfgClassName:
      "h-5 border-sky-300/14 bg-sky-300/[0.08] px-2 text-[9px] font-medium uppercase tracking-[0.1em] text-sky-100/85",
    profileClassName:
      "h-7 border-sky-300/20 bg-sky-300/10 px-3 text-[11px] font-medium text-sky-100",
  },
};

export function getBadgePreset(slug: string) {
  return BADGE_PRESET_BY_SLUG[slug] ?? null;
}

export function getBadgeAssetSrc(slug: string, icon: string | null) {
  if (getBadgePreset(slug)) {
    return null;
  }

  if (icon?.trim()) {
    return icon.trim();
  }

  return null;
}
