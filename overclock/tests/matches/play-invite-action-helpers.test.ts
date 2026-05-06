import test from "node:test";
import assert from "node:assert/strict";

import {
  mapExpirePlayInvitesActionResult,
  mapPlayInviteUpdateErrorMessage,
  mapRemoveProfileConnectionActionResult,
  mapSendPlayInviteActionResult,
  mapUpdatePlayInviteActionResult,
  optionalTrimmedString,
} from "../../app/matches/play-invite-action-helpers";

test("optionalTrimmedString trims meaningful values", () => {
  assert.equal(optionalTrimmedString("  hello  "), "hello");
  assert.equal(optionalTrimmedString("   "), null);
  assert.equal(optionalTrimmedString(undefined), null);
});

test("send action mapper returns success for created invites", () => {
  const result = mapSendPlayInviteActionResult({
    created: true,
    errorCode: null,
    inviteId: "invite-1",
  });

  assert.deepEqual(result, {
    status: "success",
    inviteId: "invite-1",
  });
});

test("send action mapper groups duplicate and rate limit failures", () => {
  assert.deepEqual(
    mapSendPlayInviteActionResult({
      created: false,
      errorCode: "duplicate_pending_invite",
      inviteId: null,
    }),
    {
      status: "error",
      message: "You already have a pending invite out to this player.",
    }
  );

  assert.deepEqual(
    mapSendPlayInviteActionResult({
      created: false,
      errorCode: "already_connected",
      inviteId: null,
    }),
    {
      status: "error",
      message: "You are already connected with this player.",
    }
  );

  assert.deepEqual(
    mapSendPlayInviteActionResult({
      created: false,
      errorCode: "recipient_rate_limited",
      inviteId: null,
    }),
    {
      status: "error",
      message: "You are sending invites too quickly right now.",
    }
  );
});

test("send action mapper treats sender auth failures as unauthenticated", () => {
  const result = mapSendPlayInviteActionResult({
    created: false,
    errorCode: "sender_not_found",
    inviteId: null,
  });

  assert.deepEqual(result, {
    status: "unauthenticated",
  });
});

test("update error mapper returns specific copy for known codes", () => {
  assert.equal(
    mapPlayInviteUpdateErrorMessage("invite_expired"),
    "That invite has already expired."
  );
  assert.equal(
    mapPlayInviteUpdateErrorMessage("forbidden"),
    "You do not have permission to update that invite."
  );
  assert.equal(
    mapPlayInviteUpdateErrorMessage("invalid_state"),
    "That invite can no longer be updated."
  );
});

test("update action mapper returns success and fallback errors", () => {
  assert.deepEqual(
    mapUpdatePlayInviteActionResult({
      errorCode: null,
      inviteId: "invite-2",
      status: "declined",
      updated: true,
    }),
    {
      status: "success",
      inviteId: "invite-2",
      inviteStatus: "declined",
    }
  );

  assert.deepEqual(
    mapUpdatePlayInviteActionResult({
      errorCode: "invalid_invite",
      inviteId: null,
      status: null,
      updated: false,
    }),
    {
      status: "error",
      message: "That invite is no longer available.",
    }
  );
});

test("expire action mapper handles auth, error, and success", () => {
  assert.deepEqual(
    mapExpirePlayInvitesActionResult({
      errorCode: "unauthenticated",
      expiredCount: 0,
    }),
    {
      status: "unauthenticated",
    }
  );

  assert.deepEqual(
    mapExpirePlayInvitesActionResult({
      errorCode: "invalid_response",
      expiredCount: 0,
    }),
    {
      status: "error",
      message: "Unable to expire invites right now.",
    }
  );

  assert.deepEqual(
    mapExpirePlayInvitesActionResult({
      errorCode: null,
      expiredCount: 4,
    }),
    {
      status: "success",
      expiredCount: 4,
    }
  );
});

test("remove connection mapper handles success and state failures", () => {
  assert.deepEqual(
    mapRemoveProfileConnectionActionResult({
      connectionId: "connection-2",
      errorCode: null,
      updated: true,
    }),
    {
      status: "success",
      connectionId: "connection-2",
    }
  );

  assert.deepEqual(
    mapRemoveProfileConnectionActionResult({
      connectionId: "connection-2",
      errorCode: "invalid_state",
      updated: false,
    }),
    {
      status: "error",
      message: "That connection has already been removed.",
    }
  );
});
