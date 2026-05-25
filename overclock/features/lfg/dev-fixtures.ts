import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import { HERO_ROSTER } from "@/lib/heroes/hero-roster";
import type { LFGHeroSnapshot, LFGPost, LFGType, StackMember } from "@/lib/lfg/lfg-post-types";
import { REGION_TO_TIMEZONES, RANK_TIERS } from "@/lib/profiles/profile-options";

const FIXTURE_POST_COUNT = 54;

const FIXTURE_BANNER_IMAGES = [
  "/placeholders/banner/0a37d3299090e714c27ca4ba36220aa6.jpg",
  "/placeholders/banner/1fa29c0ad6805b6130bb78f451f422f0.jpg",
  "/placeholders/banner/3436f860fcf6fb3d63c8b3f1879e9f8e.jpg",
  "/placeholders/banner/410a68e361c75ed91e2571fe8f5257d5.jpg",
  "/placeholders/banner/5f85828c351bbf6f3c7efdfff2fdef5b.jpg",
  "/placeholders/banner/743c7285a67febbdc8d5c3ad257fd708.jpg",
  "/placeholders/banner/896c615739b2594bc646fbdc17c45ed6.jpg",
  "/placeholders/banner/a979c6c076340785ffc56a699230048d.jpg",
  "/placeholders/banner/b5e3338ba6dd51ccdd1b7cbc5118cad3.jpg",
  "/placeholders/banner/b8dae323f9892e3de4ed7ceccbd340e3.jpg",
];

const FIXTURE_PFP_IMAGES = [
  "/placeholders/pfp/0f8a88f3c987b51046a7d8086c750449.jpg",
  "/placeholders/pfp/1b07b82738e053b64b5d95dcd28a2781.jpg",
  "/placeholders/pfp/21cb93eea0f079f0a76050e64b609938.jpg",
  "/placeholders/pfp/307fc483e1fec4c910b3c2165873b616.jpg",
  "/placeholders/pfp/33c9a77e102d4d6dcc11795ac3418440.jpg",
  "/placeholders/pfp/3f9ba3b5ebd62338b85c10e0b613dd01.jpg",
  "/placeholders/pfp/4239fad75f074f573f6691cc4009ffe5.jpg",
  "/placeholders/pfp/4437760c905f6a330a05e57921d6986e.jpg",
  "/placeholders/pfp/7f59d3651ffcb134c91c7643b19809e8.jpg",
  "/placeholders/pfp/9456d44e85751efac16fc93a639b5e48.jpg",
  "/placeholders/pfp/b0a951c7cae698d6871b8a9beb228aa1.jpg",
  "/placeholders/pfp/c2972ae005ef58efc97273174639887b.jpg",
];
const FIXTURE_REGIONS = Object.keys(REGION_TO_TIMEZONES) as Array<
  keyof typeof REGION_TO_TIMEZONES
>;
const FIXTURE_ROLES: CompetitiveRole[] = ["tank", "dps", "support"];
const FIXTURE_GAME_MODES: Array<LFGPost["gameMode"]> = ["ranked", "quick_play"];
const FIXTURE_PLATFORMS = ["PC", "Console"] as const;
const FIXTURE_AUTHOR_NAMES = [
  "kira",
  "nova",
  "sleepy",
  "riven",
  "maeve",
  "zephyr",
  "coldblue",
  "phantom",
  "ember",
  "cascade",
  "noxious",
  "aria",
  "jinx",
  "vesper",
  "haze",
  "cinder",
  "lyra",
  "sable",
  "rex",
  "frost",
  "vale",
  "dusk",
  "orion",
  "vex",
  "mira",
  "echo",
  "static",
  "blaze",
  "wren",
  "tide",
  "quill",
  "lumen",
  "seren",
  "drift",
  "sol",
  "flint",
  "cove",
  "hex",
  "pine",
  "rayne",
  "nox",
  "orin",
  "clove",
  "stone",
  "veil",
  "wix",
  "briar",
  "cyan",
  "lace",
  "thorn",
  "gale",
  "ash",
  "fern",
  "rome",
];
const DUOS_TITLES = [
  "support main lf duo, i have comms and i actually rotate",
  "plat 1 flex lf a consistent duo to push diamond this season",
  "chill ranked games tonight, prefer someone who doesn't quit after one loss",
  "tank main lf a support duo, i peel and i actually listen",
  "lf a reliable duo for the rest of the season, voice preferred",
  "hardstuck plat, have comms, just need one good partner",
  "dps lf support duo who calls ults and plays for the team",
  "been solo queuing all season, lf someone to run it back with",
  "need a duo who doesn't blame and plays till the games are done",
  "low stress climb, no tilt, just good games after work",
  "lf duo for consistent nights, i play tank or support",
  "diamond last season, dropped, lf a duo to get back there",
  "just want someone to queue with who knows how to play their role",
  "support lf any dps or tank duo, i ult track and peel hard",
  "not looking for coaching, just a partner who communicates",
  "evening queues only, lf someone who plays 9pm or later",
  "flex player lf duo, i play whatever the team needs",
  "two stacks beat solo queue every time, lf my second stack",
  "lf duo who stays positive even when games go sideways",
  "tank lf support who knows when to push and when to hold",
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
  const imageIndex = index - (FIXTURE_POST_COUNT - 12);
  const useImages = imageIndex >= 0;
  return {
    avatarUrl: useImages ? (FIXTURE_PFP_IMAGES[imageIndex % FIXTURE_PFP_IMAGES.length] ?? null) : null,
    badges: [],
    coverImageUrl: useImages ? (FIXTURE_BANNER_IMAGES[imageIndex % FIXTURE_BANNER_IMAGES.length] ?? null) : null,
    displayName: FIXTURE_AUTHOR_NAMES[index % FIXTURE_AUTHOR_NAMES.length] ?? "player",
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
