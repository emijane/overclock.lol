import test from "node:test";
import assert from "node:assert/strict";

import { computeStackRoleNeeds } from "../../lib/lfg/stack-role-needs";
import {
  buildOwnerStackMember,
  normalizeLFGPostRow,
} from "../../lib/lfg/posts/post-normalization";

test("stack post normalization preserves empty badge arrays for detail-style hydration", () => {
  const post = normalizeLFGPostRow(
    {
      created_at: "2026-05-23T00:00:00.000Z",
      current_member_count: 1,
      game_mode: "ranked",
      hero_pool_snapshot: [],
      id: "post-1",
      lfg_type: "stacks",
      looking_for_roles: ["tank", "dps"],
      max_group_size: 5,
      posting_role: "support",
      profile_id: "owner-1",
      profiles: {
        avatar_url: null,
        cover_image_path: null,
        display_name: "Owner",
        hide_offline_presence: false,
        is_looking_to_play: true,
        last_seen_at: "2026-05-23T01:00:00.000Z",
        username: "owner",
      },
      snapshot_platform: "PC",
      snapshot_rank_division: 1,
      snapshot_rank_tier: "Champion",
      snapshot_region: "Americas",
      snapshot_timezone: "US East",
      status: "active",
      title: "Need one more",
    },
    []
  );

  assert.deepEqual(post.author.badges, []);
  assert.equal(post.author.username, "owner");
  assert.equal(post.lfgType, "stacks");
});

test("owner fallback member normalization creates the owner entry from a stack row snapshot", () => {
  const ownerMember = buildOwnerStackMember({
    id: "post-1",
    posting_role: "tank",
    profile_id: "owner-1",
    profiles: {
      avatar_updated_at: "2026-05-23T00:00:00.000Z",
      avatar_url: "/avatar.png",
      current_rank_division: 2,
      current_rank_tier: "Master",
      display_name: "Owner",
      username: "owner",
    },
  });

  assert.deepEqual(ownerMember, {
    avatarUrl: null,
    displayName: "Owner",
    isOwner: true,
    profileId: "owner-1",
    rankDivision: 2,
    rankTier: "Master",
    role: "tank",
    username: "owner",
  });
});

test("stack role needs derive only the remaining open slots", () => {
  const needs = computeStackRoleNeeds([
    {
      avatarUrl: null,
      displayName: "Tank",
      isOwner: true,
      profileId: "tank-1",
      rankDivision: null,
      rankTier: "Champion",
      role: "tank",
      username: "tank",
    },
    {
      avatarUrl: null,
      displayName: "DPS 1",
      isOwner: false,
      profileId: "dps-1",
      rankDivision: null,
      rankTier: "Master",
      role: "dps",
      username: "dps1",
    },
    {
      avatarUrl: null,
      displayName: "Support 1",
      isOwner: false,
      profileId: "support-1",
      rankDivision: null,
      rankTier: "Master",
      role: "support",
      username: "support1",
    },
  ]);

  assert.deepEqual(Array.from(needs.entries()), [
    ["dps", 1],
    ["support", 1],
  ]);
});

test("stack role needs never go negative when a role is overfilled", () => {
  const needs = computeStackRoleNeeds([
    {
      avatarUrl: null,
      displayName: "Support 1",
      isOwner: true,
      profileId: "support-1",
      rankDivision: null,
      rankTier: "Master",
      role: "support",
      username: "support1",
    },
    {
      avatarUrl: null,
      displayName: "Support 2",
      isOwner: false,
      profileId: "support-2",
      rankDivision: null,
      rankTier: "Master",
      role: "support",
      username: "support2",
    },
    {
      avatarUrl: null,
      displayName: "Support 3",
      isOwner: false,
      profileId: "support-3",
      rankDivision: null,
      rankTier: "Master",
      role: "support",
      username: "support3",
    },
  ]);

  assert.equal(needs.get("support"), undefined);
  assert.equal(needs.get("tank"), 1);
  assert.equal(needs.get("dps"), 2);
});
