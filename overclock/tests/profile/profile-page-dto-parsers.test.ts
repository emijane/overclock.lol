import test from "node:test";
import assert from "node:assert/strict";

import { normalizeProfilePageDto } from "../../lib/pages/profile-page-dto/parsers";

test("profile DTO normalizer returns an empty DTO for non-objects", () => {
  const dto = normalizeProfilePageDto(null);

  assert.equal(dto.viewer.viewerState, "guest");
  assert.equal(dto.profile, null);
  assert.equal(dto.competitiveProfile.profileId, "");
  assert.deepEqual(dto.featuredClips, []);
  assert.deepEqual(dto.recentPosts, []);
});

test("profile DTO normalizer filters invalid rows and falls back relationship fields", () => {
  const dto = normalizeProfilePageDto({
    viewer: {
      currentUserId: "user-1",
      profileId: "viewer-profile-1",
      viewerState: "signed_in",
    },
    profile: {
      id: "profile-1",
      username: "misa",
      displayName: "Misa",
      lookingFor: ["duos", 42, "stacks"],
      hideOfflinePresence: true,
      isLookingToPlay: true,
    },
    heroPools: {
      roles: ["tank", "support", "invalid"],
      heroPicks: {
        tank: ["reinhardt"],
        support: ["ana", 7],
      },
    },
    competitiveProfile: {
      mainRole: "tank",
      platform: "pc",
      roles: [
        {
          id: "role-1",
          profileId: "profile-1",
          role: "tank",
          rankTier: "Diamond",
          rankDivision: 3,
          enabled: true,
          createdAt: "2026-05-01T00:00:00Z",
          updatedAt: "2026-05-02T00:00:00Z",
        },
        {
          id: "role-2",
          profileId: "profile-1",
          role: "invalid",
          rankTier: "Diamond",
        },
      ],
    },
    featuredClips: [
      {
        id: "clip-1",
        platform: "youtube",
        position: 1,
        url: "https://youtube.com/watch?v=abc",
        title: "Clip",
      },
      {
        id: "clip-2",
        platform: "twitch",
        position: 2,
        url: "https://twitch.tv/videos/1",
      },
    ],
    badges: [
      {
        id: "badge-1",
        slug: "verified",
        label: "Verified",
        description: "Trusted",
      },
      {
        id: "badge-2",
        slug: 7,
        label: "Broken",
      },
    ],
    recentPosts: [
      {
        id: "post-1",
        lfgType: "duos",
        title: "LF duo",
        createdAt: "2026-05-03T00:00:00Z",
        postingRole: "support",
        rankTier: "Masters",
        lookingForRoles: ["tank", 9],
      },
      {
        id: "post-2",
        lfgType: "duos",
        title: "Bad post",
        createdAt: "2026-05-03T00:00:00Z",
        postingRole: "invalid",
        rankTier: "Masters",
      },
    ],
    relationship: {
      connectionCount: 4,
      initiallyBlockedByViewer: true,
      inviteState: "invite_sent",
      pendingOutgoingInviteId: "invite-1",
    },
  });

  assert.equal(dto.viewer.viewerState, "signed_in");
  assert.equal(dto.competitiveProfile.profileId, "profile-1");
  assert.deepEqual(dto.heroPools.roles, ["tank", "support"]);
  assert.deepEqual(dto.heroPools.heroPicks.tank, ["reinhardt"]);
  assert.equal(dto.competitiveProfile.roles.length, 1);
  assert.equal(dto.featuredClips.length, 1);
  assert.equal(dto.badges.length, 1);
  assert.equal(dto.recentPosts.length, 1);
  assert.deepEqual(dto.recentPosts[0]?.lookingForRoles, ["tank"]);
  assert.equal(dto.relationship.connectionCount, 4);
  assert.equal(dto.relationship.initiallyBlockedByViewer, true);
  assert.equal(dto.relationship.inviteState, "invite_sent");
});

test("profile DTO normalizer falls back competitive profile id and guest-safe relationship defaults", () => {
  const dto = normalizeProfilePageDto({
    viewer: {
      viewerState: "not-real",
    },
    profile: {
      id: "profile-2",
      username: "echo",
    },
    competitiveProfile: {
      mainRole: "not-real",
      platform: 123,
      roles: "bad-data",
    },
    relationship: {
      connectionCount: "oops",
      inviteState: "pending-ish",
    },
  });

  assert.equal(dto.viewer.viewerState, "guest");
  assert.equal(dto.competitiveProfile.profileId, "profile-2");
  assert.equal(dto.competitiveProfile.mainRole, null);
  assert.equal(dto.competitiveProfile.platform, null);
  assert.deepEqual(dto.competitiveProfile.roles, []);
  assert.equal(dto.relationship.connectionCount, 0);
  assert.equal(dto.relationship.inviteState, "invite_to_play");
});
