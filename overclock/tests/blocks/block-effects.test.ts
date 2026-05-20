import test from "node:test";
import assert from "node:assert/strict";

import { getBlockRevalidationPaths } from "../../lib/blocks/block-effects";
import { normalizeUserBlockRpcResult } from "../../lib/blocks/user-blocks";

test("block revalidation paths include all shared surfaces and profile views", () => {
  const paths = getBlockRevalidationPaths({
    currentUsername: "misa",
    targetUsername: "echo",
  });

  assert.deepEqual(paths, [
    "/account",
    "/duos",
    "/lfg",
    "/matches",
    "/search/users",
    "/stacks",
    "/u/misa",
    "/u/echo",
  ]);
});

test("user block RPC normalizer unwraps create and delete payloads", () => {
  assert.deepEqual(
    normalizeUserBlockRpcResult({
      create_user_block: {
        actor_username: "misa",
        created: true,
        error_code: null,
        target_username: "echo",
      },
    }),
    {
      actor_username: "misa",
      created: true,
      error_code: null,
      removed: false,
      target_username: "echo",
    }
  );

  assert.deepEqual(
    normalizeUserBlockRpcResult(
      JSON.stringify({
        delete_user_block: {
          actor_username: "misa",
          removed: true,
          target_username: "echo",
        },
      })
    ),
    {
      actor_username: "misa",
      created: false,
      error_code: null,
      removed: true,
      target_username: "echo",
    }
  );
});

test("user block RPC normalizer guards malformed payloads", () => {
  assert.deepEqual(normalizeUserBlockRpcResult(null), {
    error_code: "invalid_response",
  });
});
