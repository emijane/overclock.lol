export type HeroPoolRole =
  | "tank"
  | "dps_hitscan"
  | "dps_flex"
  | "support_main"
  | "support_flex";

export type HeroDefinition = {
  id: string;
  imageSrc: string;
  label: string;
  pool: HeroPoolRole;
};

// Shared roster metadata for hero-pool selection and public profile rendering.
// The newer/custom roster entries are mapped with best-fit sample roles for now
// and can be adjusted once you lock the final design intent for each hero.
export const HERO_ROSTER: readonly HeroDefinition[] = [
  { id: "ana", label: "Ana", imageSrc: "/hero-images/ana.png", pool: "support_main" },
  { id: "anran", label: "Anran", imageSrc: "/hero-images/anran.png", pool: "support_flex" },
  { id: "ashe", label: "Ashe", imageSrc: "/hero-images/ashe.png", pool: "dps_hitscan" },
  { id: "baptiste", label: "Baptiste", imageSrc: "/hero-images/baptiste.png", pool: "support_flex" },
  { id: "bastion", label: "Bastion", imageSrc: "/hero-images/bastion.png", pool: "dps_hitscan" },
  { id: "brigitte", label: "Brigitte", imageSrc: "/hero-images/brigitte.png", pool: "support_main" },
  { id: "cassidy", label: "Cassidy", imageSrc: "/hero-images/cassidy.png", pool: "dps_hitscan" },
  { id: "domina", label: "Domina", imageSrc: "/hero-images/domina.png", pool: "dps_flex" },
  { id: "doomfist", label: "Doomfist", imageSrc: "/hero-images/doomfist.png", pool: "tank" },
  { id: "dva", label: "D.Va", imageSrc: "/hero-images/dva.png", pool: "tank" },
  { id: "echo", label: "Echo", imageSrc: "/hero-images/echo.png", pool: "dps_flex" },
  { id: "emre", label: "Emre", imageSrc: "/hero-images/emre.png", pool: "dps_hitscan" },
  { id: "freja", label: "Freja", imageSrc: "/hero-images/freja.png", pool: "dps_flex" },
  { id: "genji", label: "Genji", imageSrc: "/hero-images/genji.png", pool: "dps_flex" },
  { id: "hanzo", label: "Hanzo", imageSrc: "/hero-images/hanzo.png", pool: "dps_flex" },
  { id: "hazard", label: "Hazard", imageSrc: "/hero-images/hazard.png", pool: "tank" },
  { id: "illari", label: "Illari", imageSrc: "/hero-images/illari.png", pool: "support_flex" },
  { id: "jetpack-cat", label: "Jetpack Cat", imageSrc: "/hero-images/jetpack-cat.png", pool: "support_flex" },
  { id: "junker-queen", label: "Junker Queen", imageSrc: "/hero-images/junker-queen.png", pool: "tank" },
  { id: "junkrat", label: "Junkrat", imageSrc: "/hero-images/junkrat.png", pool: "dps_flex" },
  { id: "juno", label: "Juno", imageSrc: "/hero-images/juno.png", pool: "support_flex" },
  { id: "kiriko", label: "Kiriko", imageSrc: "/hero-images/kiriko.png", pool: "support_flex" },
  { id: "lifeweaver", label: "Lifeweaver", imageSrc: "/hero-images/lifeweaver.png", pool: "support_main" },
  { id: "lucio", label: "Lucio", imageSrc: "/hero-images/lucio.png", pool: "support_main" },
  { id: "mauga", label: "Mauga", imageSrc: "/hero-images/mauga.png", pool: "tank" },
  { id: "mei", label: "Mei", imageSrc: "/hero-images/mei.png", pool: "dps_flex" },
  { id: "mercy", label: "Mercy", imageSrc: "/hero-images/mercy.png", pool: "support_main" },
  { id: "mizuki", label: "Mizuki", imageSrc: "/hero-images/mizuki.png", pool: "support_flex" },
  { id: "moira", label: "Moira", imageSrc: "/hero-images/moira.png", pool: "support_flex" },
  { id: "orisa", label: "Orisa", imageSrc: "/hero-images/orisa.png", pool: "tank" },
  { id: "pharah", label: "Pharah", imageSrc: "/hero-images/pharah.png", pool: "dps_flex" },
  { id: "ramattra", label: "Ramattra", imageSrc: "/hero-images/ramattra.png", pool: "tank" },
  { id: "reaper", label: "Reaper", imageSrc: "/hero-images/reaper.png", pool: "dps_flex" },
  { id: "reinhardt", label: "Reinhardt", imageSrc: "/hero-images/reinhardt.png", pool: "tank" },
  { id: "roadhog", label: "Roadhog", imageSrc: "/hero-images/roadhog.png", pool: "tank" },
  { id: "sigma", label: "Sigma", imageSrc: "/hero-images/sigma.png", pool: "tank" },
  { id: "sojourn", label: "Sojourn", imageSrc: "/hero-images/sojourn.png", pool: "dps_hitscan" },
  { id: "soldier-76", label: "Soldier: 76", imageSrc: "/hero-images/soldier-76.png", pool: "dps_hitscan" },
  { id: "sombra", label: "Sombra", imageSrc: "/hero-images/sombra.png", pool: "dps_flex" },
  { id: "symmetra", label: "Symmetra", imageSrc: "/hero-images/symmetra.png", pool: "dps_flex" },
  { id: "torbjorn", label: "Torbjorn", imageSrc: "/hero-images/torbjorn.png", pool: "dps_flex" },
  { id: "tracer", label: "Tracer", imageSrc: "/hero-images/tracer.png", pool: "dps_flex" },
  { id: "vendetta", label: "Vendetta", imageSrc: "/hero-images/vendetta.png", pool: "dps_hitscan" },
  { id: "venture", label: "Venture", imageSrc: "/hero-images/venture.png", pool: "dps_flex" },
  { id: "widowmaker", label: "Widowmaker", imageSrc: "/hero-images/widowmaker.png", pool: "dps_hitscan" },
  { id: "winston", label: "Winston", imageSrc: "/hero-images/winston.png", pool: "tank" },
  { id: "wrecking-ball", label: "Wrecking Ball", imageSrc: "/hero-images/wrecking-ball.png", pool: "tank" },
  { id: "wuyang", label: "Wuyang", imageSrc: "/hero-images/wuyang.png", pool: "tank" },
  { id: "zarya", label: "Zarya", imageSrc: "/hero-images/zarya.png", pool: "tank" },
  { id: "zenyatta", label: "Zenyatta", imageSrc: "/hero-images/zenyatta.png", pool: "support_flex" },
] as const;

export const HERO_POOL_LABELS: Record<HeroPoolRole, string> = {
  tank: "Tank",
  dps_hitscan: "Hitscan",
  dps_flex: "Flex",
  support_main: "Main Support",
  support_flex: "Flex Support",
};


export const HERO_POOL_GROUPS = [
  {
    label: "Tank",
    pools: ["tank"],
  },
  {
    label: "DPS",
    pools: ["dps_hitscan", "dps_flex"],
  },
  {
    label: "Support",
    pools: ["support_main", "support_flex"],
  },
] as const satisfies ReadonlyArray<{
  label: string;
  pools: readonly HeroPoolRole[];
}>;
