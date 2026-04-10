const rankIconSrcByTier = {
  Bronze: "/ranks/9 Bronze.png",
  Silver: "/ranks/8 Silver.png",
  Gold: "/ranks/7 Gold.png",
  Platinum: "/ranks/6 Platinum.png",
  Diamond: "/ranks/5 Diamond.png",
  Master: "/ranks/4 Masters.png",
  Grandmaster: "/ranks/3 Grandmaster.png",
  Champion: "/ranks/2 Champion.png",
  "Top 500": "/ranks/1 Top 500.png",
} as const;

export function getRankIconSrc(tier: string | null) {
  if (!tier || tier === "Unranked") {
    return null;
  }

  return rankIconSrcByTier[tier as keyof typeof rankIconSrcByTier] ?? null;
}
