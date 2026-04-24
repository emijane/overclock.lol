const BADGE_ASSET_BY_SLUG: Record<string, string> = {
  founder: "/badges/founder-badge.png",
  staff: "/badges/staff-badge.png",
};

export function getBadgeAssetSrc(slug: string, icon: string | null) {
  if (icon?.trim()) {
    return icon.trim();
  }

  return BADGE_ASSET_BY_SLUG[slug] ?? null;
}

