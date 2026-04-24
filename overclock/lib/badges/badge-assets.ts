const BADGE_ASSET_BY_SLUG: Record<string, string> = {
  "founder-badge": "/badges/founder-badge.png",
  "staff-badge": "/badges/staff-badge.png",
};

export function getBadgeAssetSrc(slug: string, icon: string | null) {
  if (icon?.trim()) {
    return icon.trim();
  }

  return BADGE_ASSET_BY_SLUG[slug] ?? null;
}
