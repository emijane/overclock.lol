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
    "--profile-rank-border": "rgba(232,146,92,0.78)",
    "--profile-rank-glow": "rgba(184,92,52,0.22)",
  },
  Silver: {
    "--profile-rank-border": "rgba(226,238,246,0.72)",
    "--profile-rank-glow": "rgba(176,194,212,0.2)",
  },
  Gold: {
    "--profile-rank-border": "rgba(250,232,132,0.8)",
    "--profile-rank-glow": "rgba(224,176,56,0.22)",
  },
  Platinum: {
    "--profile-rank-border": "rgba(214,255,255,0.76)",
    "--profile-rank-glow": "rgba(168,204,220,0.22)",
  },
  Diamond: {
    "--profile-rank-border": "rgba(142,190,255,0.8)",
    "--profile-rank-glow": "rgba(78,114,186,0.24)",
  },
  Master: {
    "--profile-rank-border": "rgba(206,238,220,0.76)",
    "--profile-rank-glow": "rgba(62,118,82,0.22)",
  },
  Grandmaster: {
    "--profile-rank-border": "rgba(246,230,255,0.76)",
    "--profile-rank-glow": "rgba(86,64,142,0.24)",
  },
  Champion: {
    "--profile-rank-border": "rgba(248,182,255,0.82)",
    "--profile-rank-glow": "rgba(188,96,255,0.26)",
  },
  "Top 500": {
    "--profile-rank-border": "rgba(248,232,152,0.82)",
    "--profile-rank-glow": "rgba(234,188,72,0.26)",
  },
};

const defaultRankAccentStyle: RankAccentStyle = {
  "--profile-rank-border": "rgba(190,190,202,0.62)",
  "--profile-rank-glow": "rgba(132,132,144,0.18)",
};

export function getRankBorderClassName(rankTier: string | null | undefined) {
  return rankBorderClassNameByTier[rankTier ?? ""] ?? defaultRankBorderClassName;
}

export function getRankAccentStyle(rankTier: string | null | undefined) {
  return rankAccentStyleByTier[rankTier ?? ""] ?? defaultRankAccentStyle;
}
