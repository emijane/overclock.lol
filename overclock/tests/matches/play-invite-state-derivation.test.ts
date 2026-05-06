import test from "node:test";
import assert from "node:assert/strict";

import {
  deriveLFGInviteStates,
  deriveProfileInviteState,
} from "../../lib/matches/play-invite-state-derivation";

test("profile state stays invite_to_play for guests and self views", () => {
  assert.equal(
    deriveProfileInviteState({
      acceptedCount: 0,
      currentProfileId: null,
      pendingCount: 2,
      targetProfileId: "target-1",
    }),
    "invite_to_play"
  );

  assert.equal(
    deriveProfileInviteState({
      acceptedCount: 1,
      currentProfileId: "same-user",
      pendingCount: 1,
      targetProfileId: "same-user",
    }),
    "invite_to_play"
  );
});

test("profile state gives matches precedence over pending invites", () => {
  assert.equal(
    deriveProfileInviteState({
      acceptedCount: 1,
      currentProfileId: "viewer-1",
      pendingCount: 1,
      targetProfileId: "target-1",
    }),
    "matched"
  );
});

test("profile state falls back to invite_sent when only pending exists", () => {
  assert.equal(
    deriveProfileInviteState({
      acceptedCount: 0,
      currentProfileId: "viewer-1",
      pendingCount: 1,
      targetProfileId: "target-1",
    }),
    "invite_sent"
  );
});

test("lfg state derivation defaults to invite_to_play for guests", () => {
  const states = deriveLFGInviteStates({
    acceptedPairs: [],
    currentProfileId: null,
    pendingInvites: [
      {
        recipientProfileId: "player-2",
        sourceLFGPostId: "post-2",
      },
    ],
    posts: [
      { id: "post-1", profileId: "player-1" },
      { id: "post-2", profileId: "player-2" },
    ],
  });

  assert.deepEqual(states, {
    "post-1": "invite_to_play",
    "post-2": "invite_to_play",
  });
});

test("lfg state derivation ignores own and profileless posts", () => {
  const states = deriveLFGInviteStates({
    acceptedPairs: [],
    currentProfileId: "viewer-1",
    pendingInvites: [
      {
        recipientProfileId: "viewer-1",
        sourceLFGPostId: "post-own",
      },
    ],
    posts: [
      { id: "post-own", profileId: "viewer-1" },
      { id: "post-anon", profileId: null },
    ],
  });

  assert.deepEqual(states, {
    "post-own": "invite_to_play",
    "post-anon": "invite_to_play",
  });
});

test("lfg state derivation maps pending and matched posts", () => {
  const states = deriveLFGInviteStates({
    acceptedPairs: [
      {
        recipientProfileId: "player-3",
        senderProfileId: "viewer-1",
      },
    ],
    currentProfileId: "viewer-1",
    pendingInvites: [
      {
        recipientProfileId: "player-2",
        sourceLFGPostId: "post-2",
      },
    ],
    posts: [
      { id: "post-2", profileId: "player-2" },
      { id: "post-3", profileId: "player-3" },
      { id: "post-4", profileId: "player-4" },
    ],
  });

  assert.deepEqual(states, {
    "post-2": "invite_sent",
    "post-3": "matched",
    "post-4": "invite_to_play",
  });
});

test("lfg state derivation keeps matched state when stale pending also exists", () => {
  const states = deriveLFGInviteStates({
    acceptedPairs: [
      {
        recipientProfileId: "player-2",
        senderProfileId: "viewer-1",
      },
    ],
    currentProfileId: "viewer-1",
    pendingInvites: [
      {
        recipientProfileId: "player-2",
        sourceLFGPostId: "post-2",
      },
    ],
    posts: [{ id: "post-2", profileId: "player-2" }],
  });

  assert.deepEqual(states, {
    "post-2": "matched",
  });
});
