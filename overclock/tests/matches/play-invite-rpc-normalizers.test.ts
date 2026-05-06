import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeExpirePlayInvitesResult,
  normalizeSendPlayInviteResult,
  normalizeUpdatePlayInviteResult,
} from "../../lib/matches/play-invite-rpc-normalizers";

test("send normalizer reads nested RPC payloads", () => {
  const result = normalizeSendPlayInviteResult({
    send_play_invite: {
      created: true,
      error_code: null,
      invite_id: "invite-123",
    },
  });

  assert.deepEqual(result, {
    created: true,
    errorCode: null,
    inviteId: "invite-123",
  });
});

test("send normalizer tolerates invalid payloads", () => {
  const result = normalizeSendPlayInviteResult("not-json");

  assert.deepEqual(result, {
    created: false,
    errorCode: "invalid_response",
    inviteId: null,
  });
});

test("update normalizer accepts wrapped string responses", () => {
  const result = normalizeUpdatePlayInviteResult(
    JSON.stringify({
      accept_play_invite: {
        updated: true,
        invite_id: "invite-456",
        status: "accepted",
      },
    }),
    "accept_play_invite"
  );

  assert.deepEqual(result, {
    errorCode: null,
    inviteId: "invite-456",
    status: "accepted",
    updated: true,
  });
});

test("update normalizer rejects unknown statuses", () => {
  const result = normalizeUpdatePlayInviteResult(
    {
      cancel_play_invite: {
        updated: true,
        invite_id: "invite-789",
        status: "mystery",
      },
    },
    "cancel_play_invite"
  );

  assert.deepEqual(result, {
    errorCode: null,
    inviteId: "invite-789",
    status: null,
    updated: true,
  });
});

test("expire normalizer reads array payloads", () => {
  const result = normalizeExpirePlayInvitesResult([
    {
      error_code: null,
      expired_count: 3,
    },
  ]);

  assert.deepEqual(result, {
    errorCode: null,
    expiredCount: 3,
  });
});

test("expire normalizer falls back for malformed input", () => {
  const result = normalizeExpirePlayInvitesResult(null);

  assert.deepEqual(result, {
    errorCode: "invalid_response",
    expiredCount: 0,
  });
});
