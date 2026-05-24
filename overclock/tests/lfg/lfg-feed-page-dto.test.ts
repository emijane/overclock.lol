import test from "node:test";
import assert from "node:assert/strict";

import { resolveAuthorizedViewerProfileId } from "../../lib/pages/lfg-feed-page-dto";

test("feed viewer bundle only authorizes the current signed-in profile", () => {
  assert.equal(
    resolveAuthorizedViewerProfileId({
      currentProfileId: "viewer-1",
      requestedViewerProfileId: "viewer-1",
    }),
    "viewer-1"
  );

  assert.equal(
    resolveAuthorizedViewerProfileId({
      currentProfileId: "viewer-1",
      requestedViewerProfileId: "viewer-2",
    }),
    null
  );

  assert.equal(
    resolveAuthorizedViewerProfileId({
      currentProfileId: null,
      requestedViewerProfileId: "viewer-1",
    }),
    null
  );
});
