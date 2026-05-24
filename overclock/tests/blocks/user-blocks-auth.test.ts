import test from "node:test";
import assert from "node:assert/strict";

import {
  canCurrentProfileAccessBlockPair,
  canCurrentProfileAccessBlockViewer,
} from "../../lib/blocks/user-blocks";

test("block viewer access only allows the current signed-in profile to load its own block list", () => {
  assert.equal(
    canCurrentProfileAccessBlockViewer({
      currentProfileId: "viewer-1",
      viewerProfileId: "viewer-1",
    }),
    true
  );

  assert.equal(
    canCurrentProfileAccessBlockViewer({
      currentProfileId: "viewer-1",
      viewerProfileId: "viewer-2",
    }),
    false
  );

  assert.equal(
    canCurrentProfileAccessBlockViewer({
      currentProfileId: null,
      viewerProfileId: "viewer-1",
    }),
    false
  );
});

test("block pair access requires the current signed-in profile to participate in the pair", () => {
  assert.equal(
    canCurrentProfileAccessBlockPair({
      currentProfileId: "viewer-1",
      profileA: "viewer-1",
      profileB: "target-1",
    }),
    true
  );

  assert.equal(
    canCurrentProfileAccessBlockPair({
      currentProfileId: "viewer-1",
      profileA: "target-1",
      profileB: "viewer-1",
    }),
    true
  );

  assert.equal(
    canCurrentProfileAccessBlockPair({
      currentProfileId: "viewer-1",
      profileA: "target-1",
      profileB: "target-2",
    }),
    false
  );

  assert.equal(
    canCurrentProfileAccessBlockPair({
      currentProfileId: null,
      profileA: "viewer-1",
      profileB: "target-1",
    }),
    false
  );
});
