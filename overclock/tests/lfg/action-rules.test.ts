import test from "node:test";
import assert from "node:assert/strict";

import {
  getCreateLFGPostErrorMessage,
  getPublicStackDebugMessage,
  resolveCloseLFGReturnPath,
  shouldRedirectToLoginForCreateError,
  shouldShowStackCreateDebugMessage,
} from "../../features/lfg/action-rules";
import {
  normalizeLFGCloseResult,
  normalizeLFGCreateResult,
} from "../../lib/lfg/posts/post-normalization";

test("create LFG error messages map known business failures", () => {
  assert.equal(
    getCreateLFGPostErrorMessage("duplicate_active_post"),
    "You already have an active post in this section with this title."
  );
  assert.equal(
    getCreateLFGPostErrorMessage("active_slot_limit"),
    "You already have the maximum number of active posts for this role."
  );
  assert.equal(
    getCreateLFGPostErrorMessage("already_in_active_stack"),
    "You already belong to an active stack. Leave or close it before creating another."
  );
  assert.equal(
    getCreateLFGPostErrorMessage("mystery_error"),
    "Unable to create your post right now."
  );
});

test("create LFG auth redirect rules only treat auth failures as login-worthy", () => {
  assert.equal(shouldRedirectToLoginForCreateError("unauthenticated"), true);
  assert.equal(shouldRedirectToLoginForCreateError("forbidden"), true);
  assert.equal(shouldRedirectToLoginForCreateError("duplicate_active_post"), false);
});

test("stack create debug detection is limited to stack sync failures", () => {
  assert.equal(
    shouldShowStackCreateDebugMessage("stacks", {
      code: "PGRST202",
      message: "Could not find create_lfg_post_atomic with stack_members support",
    }),
    true
  );
  assert.equal(
    shouldShowStackCreateDebugMessage("duos", {
      code: "PGRST202",
      message: "Could not find create_lfg_post_atomic with stack_members support",
    }),
    false
  );
  assert.equal(
    shouldShowStackCreateDebugMessage("stacks", {
      code: "XX000",
      message: "Generic database failure",
    }),
    false
  );
});

test("public stack debug messages compact noisy errors", () => {
  const result = getPublicStackDebugMessage({
    code: "PGRST202",
    message: " Could not find create_lfg_post_atomic because stack_members is still syncing ",
  });

  assert.equal(
    result,
    "Stack debug: PGRST202 Could not find create_lfg_post_atomic because stack_members is still syncing"
  );
});

test("close return path rules preserve profile and hub views", () => {
  assert.deepEqual(
    resolveCloseLFGReturnPath({
      fallbackPath: "/u/misa",
      resultLfgType: "stacks",
    }),
    {
      redirectPath: "/stacks",
      returnPath: "/u/misa",
    }
  );

  assert.deepEqual(
    resolveCloseLFGReturnPath({
      fallbackPath: "/account/posts",
      resultLfgType: "duos",
    }),
    {
      redirectPath: "/duos",
      returnPath: "/duos",
    }
  );
});

test("LFG create normalizer unwraps nested RPC payloads and rejects malformed input", () => {
  assert.deepEqual(
    normalizeLFGCreateResult({
      create_lfg_post_atomic: {
        created: true,
        error_code: null,
        post_id: "post-123",
      },
    }),
    {
      created: true,
      errorCode: null,
      postId: "post-123",
    }
  );

  assert.deepEqual(normalizeLFGCreateResult(null), {
    created: false,
    errorCode: "invalid_response",
    postId: null,
  });
});

test("LFG close normalizer accepts wrapped payloads and guards invalid types", () => {
  assert.deepEqual(
    normalizeLFGCloseResult(
      JSON.stringify({
        close_owned_lfg_post: {
          error_code: null,
          lfg_type: "stacks",
          updated: true,
        },
      })
    ),
    {
      errorCode: null,
      lfgType: "stacks",
      updated: true,
    }
  );

  assert.deepEqual(
    normalizeLFGCloseResult({
      close_owned_lfg_post: {
        error_code: null,
        lfg_type: "unknown",
        updated: true,
      },
    }),
    {
      errorCode: null,
      lfgType: null,
      updated: true,
    }
  );
});
