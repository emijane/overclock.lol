import test from "node:test";
import assert from "node:assert/strict";

import type { StackPostDetail } from "../../lib/lfg/posts/posts-queries";
import {
  deriveStackDetailViewerState,
  getStackInactiveStateCopy,
} from "../../lib/lfg/stack-detail-state";

function createDetail(
  overrides?: Partial<StackPostDetail>
): StackPostDetail {
  return {
    expiresAt: "2026-05-24T00:00:00.000Z",
    isActive: true,
    isExpired: false,
    post: {
      author: {
        avatarUrl: null,
        badges: [],
        coverImageUrl: null,
        displayName: "Owner",
        hideOfflinePresence: false,
        isLookingToPlay: false,
        lastSeenAt: null,
        username: "owner",
      },
      createdAt: "2026-05-23T00:00:00.000Z",
      currentMemberCount: 2,
      description: null,
      gameMode: "ranked",
      heroPool: [],
      id: "post-1",
      lfgType: "stacks",
      lookingForRoles: ["tank", "dps", "support"],
      maxGroupSize: 5,
      platform: "PC",
      postingRole: "support",
      profileId: "owner-1",
      rankDivision: 1,
      rankTier: "Champion",
      region: "Americas",
      stackMembers: [
        {
          avatarUrl: null,
          displayName: "Owner",
          isOwner: true,
          profileId: "owner-1",
          rankDivision: 1,
          rankTier: "Champion",
          role: "support",
          username: "owner",
        },
        {
          avatarUrl: null,
          displayName: "Member",
          isOwner: false,
          profileId: "member-1",
          rankDivision: 2,
          rankTier: "Master",
          role: "dps",
          username: "member",
        },
      ],
      status: "active",
      timezone: "US East",
      title: "Need one more",
    },
    ...overrides,
  };
}

test("stack detail viewer state keeps guest viewers out of owner/member-only queries", () => {
  const state = deriveStackDetailViewerState({
    currentProfileId: null,
    detail: createDetail(),
  });

  assert.deepEqual(state, {
    isAcceptedMember: false,
    isOwner: false,
    shouldFetchContactInfo: false,
    shouldFetchIncomingRequests: false,
    shouldFetchRequestState: false,
  });
});

test("stack detail viewer state gates non-members, accepted members, and owners correctly", () => {
  assert.deepEqual(
    deriveStackDetailViewerState({
      currentProfileId: "viewer-1",
      detail: createDetail(),
    }),
    {
      isAcceptedMember: false,
      isOwner: false,
      shouldFetchContactInfo: false,
      shouldFetchIncomingRequests: false,
      shouldFetchRequestState: true,
    }
  );

  assert.deepEqual(
    deriveStackDetailViewerState({
      currentProfileId: "member-1",
      detail: createDetail(),
    }),
    {
      isAcceptedMember: true,
      isOwner: false,
      shouldFetchContactInfo: true,
      shouldFetchIncomingRequests: false,
      shouldFetchRequestState: false,
    }
  );

  assert.deepEqual(
    deriveStackDetailViewerState({
      currentProfileId: "owner-1",
      detail: createDetail(),
    }),
    {
      isAcceptedMember: true,
      isOwner: true,
      shouldFetchContactInfo: true,
      shouldFetchIncomingRequests: true,
      shouldFetchRequestState: false,
    }
  );
});

test("stack detail viewer state stops active-only queries for inactive stacks", () => {
  const state = deriveStackDetailViewerState({
    currentProfileId: "owner-1",
    detail: createDetail({
      isActive: false,
      post: {
        ...createDetail().post,
        status: "closed",
      },
    }),
  });

  assert.equal(state.isOwner, true);
  assert.equal(state.shouldFetchIncomingRequests, false);
  assert.equal(state.shouldFetchRequestState, false);
  assert.equal(state.shouldFetchContactInfo, true);
});

test("stack inactive state copy distinguishes closed, expired, and generic inactive states", () => {
  assert.deepEqual(
    getStackInactiveStateCopy(
      createDetail({
        isActive: false,
        post: {
          ...createDetail().post,
          status: "closed",
        },
      })
    ),
    {
      description:
        "This stack has been closed, so join and management actions are no longer available.",
      title: "This stack is closed",
    }
  );

  assert.deepEqual(
    getStackInactiveStateCopy(
      createDetail({
        isActive: false,
        isExpired: true,
        post: {
          ...createDetail().post,
          status: "expired",
        },
      })
    ),
    {
      description:
        "This stack has expired and is no longer visible as an active listing in the feed.",
      title: "This stack has expired",
    }
  );

  assert.deepEqual(
    getStackInactiveStateCopy(
      createDetail({
        isActive: false,
        post: {
          ...createDetail().post,
          status: "filled",
        },
      })
    ),
    {
      description: "This stack is no longer available for active membership actions.",
      title: "This stack is not active",
    }
  );
});
