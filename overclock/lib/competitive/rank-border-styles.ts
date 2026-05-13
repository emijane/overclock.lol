import type { CSSProperties } from "react";

type RankAccentStyle = CSSProperties & {
  "--profile-rank-border": string;
  "--profile-rank-glow": string;
};

export const rankBorderClassNameByTier: Record<string, string> = {
  Bronze:
    "bg-gradient-to-br from-[#703020] via-[#A05030] to-[#D08050] shadow-[0_0_20px_rgba(160,80,48,0.28),0_0_36px_rgba(208,128,80,0.16)]",
  Silver:
    "bg-gradient-to-br from-[#8090A0] via-[#A0B0C0] to-[#D0E0E8] shadow-[0_0_20px_rgba(160,176,192,0.24),0_0_36px_rgba(208,224,232,0.13)]",
  Gold: "bg-gradient-to-br from-[#A06020] via-[#D0A030] to-[#F0E080] shadow-[0_0_20px_rgba(208,160,48,0.26),0_0_36px_rgba(240,224,128,0.16)]",
  Platinum:
    "bg-gradient-to-br from-[#A0C0D0] via-[#D0F0FF] to-[#D0FFFF] shadow-[0_0_20px_rgba(160,192,208,0.26),0_0_36px_rgba(208,255,255,0.16)]",
  Diamond:
    "bg-gradient-to-br from-[#4060A0] via-[#80B0F0] to-[#E0F0FF] shadow-[0_0_20px_rgba(128,176,240,0.26),0_0_36px_rgba(64,96,160,0.16)]",
  Master:
    "bg-gradient-to-br from-[#306040] via-[#90B0A0] to-[#C0E0D0] shadow-[0_0_20px_rgba(144,176,160,0.26),0_0_36px_rgba(48,96,64,0.16)]",
  Grandmaster:
    "bg-gradient-to-br from-[#403070] via-[#C0C0E0] to-[#F0E0FF] shadow-[0_0_20px_rgba(192,192,224,0.26),0_0_36px_rgba(64,48,112,0.17)]",
  Champion:
    "bg-gradient-to-br from-[#3B0764] via-[#A855F7] to-[#F0ABFC] shadow-[0_0_22px_rgba(168,85,247,0.32),0_0_40px_rgba(232,121,249,0.2)]",
  "Top 500":
    "bg-gradient-to-br from-[#103050] via-[#E0B040] to-[#F0E090] shadow-[0_0_22px_rgba(224,176,64,0.26),0_0_40px_rgba(16,48,80,0.18)]",
};

export const defaultRankBorderClassName =
  "bg-gradient-to-br from-zinc-700 via-zinc-500 to-zinc-300 shadow-[0_0_18px_rgba(113,113,122,0.2)]";

const rankAccentStyleByTier: Record<string, RankAccentStyle> = {
  Bronze: {
    "--profile-rank-border": "rgba(232,146,92,0.39)",
    "--profile-rank-glow": "rgba(184,92,52,0.22)",
  },
  Silver: {
    "--profile-rank-border": "rgba(226,238,246,0.36)",
    "--profile-rank-glow": "rgba(176,194,212,0.2)",
  },
  Gold: {
    "--profile-rank-border": "rgba(250,232,132,0.4)",
    "--profile-rank-glow": "rgba(224,176,56,0.22)",
  },
  Platinum: {
    "--profile-rank-border": "rgba(214,255,255,0.38)",
    "--profile-rank-glow": "rgba(168,204,220,0.22)",
  },
  Diamond: {
    "--profile-rank-border": "rgba(142,190,255,0.4)",
    "--profile-rank-glow": "rgba(78,114,186,0.24)",
  },
  Master: {
    "--profile-rank-border": "rgba(206,238,220,0.38)",
    "--profile-rank-glow": "rgba(62,118,82,0.22)",
  },
  Grandmaster: {
    "--profile-rank-border": "rgba(246,230,255,0.38)",
    "--profile-rank-glow": "rgba(86,64,142,0.24)",
  },
  Champion: {
    "--profile-rank-border": "rgba(248,182,255,0.41)",
    "--profile-rank-glow": "rgba(188,96,255,0.26)",
  },
  "Top 500": {
    "--profile-rank-border": "rgba(248,232,152,0.41)",
    "--profile-rank-glow": "rgba(234,188,72,0.26)",
  },
};

const defaultRankAccentStyle: RankAccentStyle = {
  "--profile-rank-border": "rgba(190,190,202,0.31)",
  "--profile-rank-glow": "rgba(132,132,144,0.18)",
};

export function getRankBorderClassName(rankTier: string | null | undefined) {
  return rankBorderClassNameByTier[rankTier ?? ""] ?? defaultRankBorderClassName;
}

export function getRankAccentStyle(rankTier: string | null | undefined) {
  return rankAccentStyleByTier[rankTier ?? ""] ?? defaultRankAccentStyle;
}

type RankPillColors = {
  bg: string;
  bgSolid: string;
  border: string;
  text: string;
  dot: string;
};

const rankPillColorsByTier: Record<string, RankPillColors> = {
  Unranked:    { bg: "rgba(113,113,122,0.10)", bgSolid: "rgba(24,24,27,0.90)",   border: "rgba(113,113,122,0.28)", text: "#a1a1aa", dot: "#71717a" },
  Bronze:      { bg: "rgba(160,80,48,0.12)",  bgSolid: "rgba(90,45,25,0.90)",   border: "rgba(200,100,60,0.35)",  text: "#D09070", dot: "#C07050" },
  Silver:      { bg: "rgba(160,176,192,0.10)", bgSolid: "rgba(48,60,72,0.90)",   border: "rgba(192,208,224,0.35)", text: "#C0D4E0", dot: "#A0B8C8" },
  Gold:        { bg: "rgba(200,152,40,0.12)",  bgSolid: "rgba(100,76,16,0.90)",  border: "rgba(234,192,60,0.35)",  text: "#E8C850", dot: "#D0A030" },
  Platinum:    { bg: "rgba(160,204,220,0.12)", bgSolid: "rgba(36,76,92,0.90)",   border: "rgba(200,244,255,0.35)", text: "#C0ECF8", dot: "#80C4E0" },
  Diamond:     { bg: "rgba(76,108,188,0.14)",  bgSolid: "rgba(20,40,112,0.90)",  border: "rgba(120,168,240,0.35)", text: "#98C0F4", dot: "#6090D8" },
  Master:      { bg: "rgba(60,100,72,0.14)",   bgSolid: "rgba(20,52,32,0.90)",   border: "rgba(140,172,156,0.35)", text: "#A8CCB8", dot: "#70A88C" },
  Grandmaster: { bg: "rgba(90,75,152,0.14)",   bgSolid: "rgba(36,28,72,0.90)",   border: "rgba(184,184,220,0.35)", text: "#C8C0E8", dot: "#9880C8" },
  Champion:    { bg: "rgba(164,80,244,0.14)",  bgSolid: "rgba(56,12,108,0.90)",  border: "rgba(208,116,252,0.35)", text: "#D084F8", dot: "#A855F7" },
  "Top 500":   { bg: "rgba(218,172,56,0.14)",  bgSolid: "rgba(76,56,8,0.90)",    border: "rgba(240,204,80,0.35)",  text: "#ECC854", dot: "#D0A030" },
};

const defaultRankPillColors: RankPillColors = {
  bg:      "rgba(113,113,122,0.10)",
  bgSolid: "rgba(24,24,27,0.90)",
  border:  "rgba(113,113,122,0.28)",
  text:    "#a1a1aa",
  dot:     "#71717a",
};

export function getRankPillColors(rankTier: string | null | undefined): RankPillColors {
  return rankPillColorsByTier[rankTier ?? ""] ?? defaultRankPillColors;
}
