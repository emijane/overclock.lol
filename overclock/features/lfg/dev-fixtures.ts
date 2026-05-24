import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import { HERO_ROSTER } from "@/lib/heroes/hero-roster";
import type { LFGHeroSnapshot, LFGPost, LFGType, StackMember } from "@/lib/lfg/lfg-post-types";
import { REGION_TO_TIMEZONES, RANK_TIERS } from "@/lib/profiles/profile-options";

const FIXTURE_POST_COUNT = 54;
const FIXTURE_REGIONS = Object.keys(REGION_TO_TIMEZONES) as Array<
  keyof typeof REGION_TO_TIMEZONES
>;
const FIXTURE_ROLES: CompetitiveRole[] = ["tank", "dps", "support"];
const FIXTURE_GAME_MODES: Array<LFGPost["gameMode"]> = ["ranked", "quick_play"];
const FIXTURE_PLATFORMS = ["PC", "Console"] as const;
const FIXTURE_AUTHOR_NAMES = [
  "Night Shift",
  "Static Bloom",
  "Orbit Theory",
  "Zero Ping",
  "Velvet Dive",
  "Crossfade",
  "Glass Comet",
  "Solar Queue",
  "Echo Harbor",
  "Prism Wake",
  "Map Tempo",
  "Late Lock",
];
const DUOS_TITLES = [
  "Looking for a calm duo to grind rank resets tonight",
  "Need one more duo for focused comms and fast queues",
  "Warmup games first, then ranked climb for a few hours",
  "Support player looking for a patient hitscan partner",
  "Tank main searching for a flexible duo with voice",
  "Quick play reps into ranked if the vibes are good",
  "Looking for steady duo chemistry and map awareness",
  "Console duo sessions with chill comms and smart tempo",
  "Solo queue is cursed, come fix it with me",
  "Need a duo for clean rotations and no tilt sessions",
];
const STACKS_TITLES = [
  "Building a late-night stack for ranked blocks and resets",
  "Need two more for a patient comp stack with comms",
  "Flexible stack looking for one support and one DPS",
  "Hosting a casual stack for fast queues and chill vibes",
  "Trying a structured five-stack with role discipline tonight",
  "Looking to fill out a stack for scrim-style ranked games",
  "Need a frontline anchor for a coordinated evening stack",
  "Small stack wants one more carry and one flex support",
  "Queueing a mellow stack for improvement-focused games",
  "Filling a ranked stack for long sessions and clean calls",
];

function getFixtureHeroPool(index: number, role: CompetitiveRole): LFGHeroSnapshot[] {
  const matchingHeroes = HERO_ROSTER.filter((hero) => {
    if (role === "tank") {
      return hero.pool === "main_tank" || hero.pool === "off_tank";
    }

    if (role === "dps") {
      return hero.pool === "dps_hitscan" || hero.pool === "dps_flex";
    }

    return hero.pool === "support_main" || hero.pool === "support_flex";
  });

  return Array.from({ length: 3 }, (_, offset) => {
    const hero = matchingHeroes[(index + offset) % matchingHeroes.length];
    return {
      id: hero.id,
      imageSrc: hero.imageSrc,
      label: hero.label,
    };
  });
}

function getFixtureRegion(index: number) {
  return FIXTURE_REGIONS[index % FIXTURE_REGIONS.length];
}

function getFixtureTimezone(index: number, region: keyof typeof REGION_TO_TIMEZONES) {
  const timezoneOptions = REGION_TO_TIMEZONES[region];
  return timezoneOptions[index % timezoneOptions.length] ?? null;
}

function getFixtureRankTier(index: number) {
  return RANK_TIERS[1 + (index % (RANK_TIERS.length - 1))] ?? "Gold";
}

function buildFixtureAuthor(index: number) {
  return {
    avatarUrl: null,
    badges: [],
    coverImageUrl: null,
    displayName: `${FIXTURE_AUTHOR_NAMES[index % FIXTURE_AUTHOR_NAMES.length]} ${index + 1}`,
    hideOfflinePresence: true,
    isLookingToPlay: false,
    lastSeenAt: null,
    username: null,
  } satisfies LFGPost["author"];
}

function buildFixturePost(input: {
  index: number;
  titlePrefix: string[];
  type: LFGType;
}): LFGPost {
  const role = FIXTURE_ROLES[input.index % FIXTURE_ROLES.length];
  const region = getFixtureRegion(input.index);
  const title = input.titlePrefix[input.index % input.titlePrefix.length] ?? "Placeholder post";

  return {
    author: buildFixtureAuthor(input.index),
    createdAt: new Date(Date.UTC(2026, 0, 1, 12, input.index % 60, 0)).toISOString(),
    currentMemberCount: 1,
    description: null,
    gameMode: FIXTURE_GAME_MODES[input.index % FIXTURE_GAME_MODES.length] ?? "ranked",
    heroPool: getFixtureHeroPool(input.index, role),
    id: `${input.type}-fixture-${input.index + 1}`,
    lfgType: input.type,
    lookingForRoles: FIXTURE_ROLES.filter((candidate) => candidate !== role),
    maxGroupSize: null,
    platform: FIXTURE_PLATFORMS[input.index % FIXTURE_PLATFORMS.length] ?? "PC",
    postingRole: role,
    profileId: null,
    rankDivision: (input.index % 5) + 1,
    rankTier: getFixtureRankTier(input.index),
    region,
    stackMembers: [],
    status: "active",
    timezone: getFixtureTimezone(input.index, region),
    title,
  };
}

function buildStackMembers(index: number, currentMemberCount: number): StackMember[] {
  return Array.from({ length: currentMemberCount }, (_, memberIndex) => {
    const role = FIXTURE_ROLES[(index + memberIndex) % FIXTURE_ROLES.length] ?? "tank";

    return {
      avatarUrl: null,
      displayName: `Stack Member ${index + 1}-${memberIndex + 1}`,
      isOwner: memberIndex === 0,
      profileId: `fixture-stack-member-${index + 1}-${memberIndex + 1}`,
      rankDivision: ((index + memberIndex) % 5) + 1,
      rankTier: getFixtureRankTier(index + memberIndex),
      role,
      username: null,
    };
  });
}

function buildStackFixturePost(index: number): LFGPost {
  const basePost = buildFixturePost({
    index,
    titlePrefix: STACKS_TITLES,
    type: "stacks",
  });
  const currentMemberCount = 2 + (index % 4);

  return {
    ...basePost,
    currentMemberCount,
    maxGroupSize: 5,
    stackMembers: buildStackMembers(index, currentMemberCount),
  };
}

export const DUOS_PLACEHOLDER_POSTS: LFGPost[] = Array.from(
  { length: FIXTURE_POST_COUNT },
  (_, index) =>
    buildFixturePost({
      index,
      titlePrefix: DUOS_TITLES,
      type: "duos",
    })
);

export const STACKS_PLACEHOLDER_POSTS: LFGPost[] = Array.from(
  { length: FIXTURE_POST_COUNT },
  (_, index) => buildStackFixturePost(index)
);
