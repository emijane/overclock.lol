import test from "node:test";
import assert from "node:assert/strict";

import {
  isMissingStackMembersSupportError,
  normalizeSendStackRequestResult,
  normalizeUpdateStackMembershipResult,
  normalizeUpdateStackRequestResult,
} from "../../lib/lfg/stack-requests";

test("send stack request normalizer unwraps nested payloads", () => {
  const result = normalizeSendStackRequestResult({
    send_stack_request: {
      created: true,
      error_code: null,
      request_id: "request-1",
    },
  });

  assert.deepEqual(result, {
    created: true,
    errorCode: null,
    requestId: "request-1",
  });
});

test("update stack request normalizer accepts wrapped string responses", () => {
  const result = normalizeUpdateStackRequestResult(
    JSON.stringify({
      accept_stack_request: {
        updated: true,
        error_code: null,
        request_id: "request-2",
        status: "accepted",
      },
    })
  );

  assert.deepEqual(result, {
    updated: true,
    errorCode: null,
    requestId: "request-2",
    status: "accepted",
  });
});

test("update stack request normalizer drops unknown statuses", () => {
  const result = normalizeUpdateStackRequestResult({
    decline_stack_request: {
      updated: true,
      error_code: null,
      request_id: "request-3",
      status: "mystery",
    },
  });

  assert.deepEqual(result, {
    updated: true,
    errorCode: null,
    requestId: "request-3",
    status: null,
  });
});

test("stack membership normalizer reads membership mutations and malformed payloads", () => {
  assert.deepEqual(
    normalizeUpdateStackMembershipResult(
      {
        leave_stack: {
          updated: true,
          error_code: null,
          member_profile_id: "profile-1",
          post_id: "post-1",
        },
      },
      "leave_stack"
    ),
    {
      updated: true,
      errorCode: null,
      memberProfileId: "profile-1",
      postId: "post-1",
    }
  );

  assert.deepEqual(normalizeUpdateStackMembershipResult(null, "leave_stack"), {
    updated: false,
    errorCode: "invalid_response",
    memberProfileId: null,
    postId: null,
  });
});

test("missing stack members support detection only matches migration-shaped errors", () => {
  assert.equal(
    isMissingStackMembersSupportError({
      code: "PGRST202",
      message: "Could not find stack_members",
    }),
    true
  );
  assert.equal(
    isMissingStackMembersSupportError({
      code: "23505",
      message: "duplicate key value violates unique constraint stack_members",
    }),
    false
  );
});
