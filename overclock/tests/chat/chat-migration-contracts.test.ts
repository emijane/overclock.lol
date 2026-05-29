import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const migrationPath = path.join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260528120000_add_duo_chat_foundation.sql"
);
const migrationSql = readFileSync(migrationPath, "utf8");

function getFunctionBody(functionName: string) {
  const startMarker = `create or replace function public.${functionName}`;
  const startIndex = migrationSql.indexOf(startMarker);
  assert.notEqual(startIndex, -1, `${functionName} should exist in the migration`);

  const nextFunctionIndex = migrationSql.indexOf(
    "create or replace function public.",
    startIndex + startMarker.length
  );

  return migrationSql.slice(
    startIndex,
    nextFunctionIndex === -1 ? undefined : nextFunctionIndex
  );
}

test("chat migration keeps helper functions private to SQL/policies", () => {
  assert.doesNotMatch(
    migrationSql,
    /grant execute on function public\.is_chat_thread_participant\(uuid, uuid\) to authenticated;/i
  );
  assert.doesNotMatch(
    migrationSql,
    /grant execute on function public\.can_read_chat_thread\(uuid, uuid\) to authenticated;/i
  );
});

test("chat migration keeps chat_messages read-only for authenticated users", () => {
  assert.match(
    migrationSql,
    /grant select on table public\.chat_messages to authenticated;/i
  );
  assert.doesNotMatch(
    migrationSql,
    /grant .*insert.* on table public\.chat_messages to authenticated;/i
  );
  assert.doesNotMatch(
    migrationSql,
    /grant .*update.* on table public\.chat_messages to authenticated;/i
  );
  assert.doesNotMatch(
    migrationSql,
    /grant .*delete.* on table public\.chat_messages to authenticated;/i
  );
});

test("get_social_threads_dto stays a pure inbox read path", () => {
  const functionBody = getFunctionBody("get_social_threads_dto()");

  assert.doesNotMatch(
    functionBody,
    /refresh_duo_chat_thread_lock_state/i
  );
});

test("chat thread identity stays invite-anchored and idempotent", () => {
  assert.match(
    migrationSql,
    /create unique index if not exists chat_threads_source_invite_unique_idx/i
  );
  assert.match(
    migrationSql,
    /hashtext\('duo_chat_thread_invite'\)/i
  );
  assert.match(
    migrationSql,
    /on conflict \(source_invite_id\)\s+where source_invite_id is not null/i
  );
});

test("get_chat_thread_messages avoids lock refresh work on the pagination path", () => {
  const functionBody = getFunctionBody("get_chat_thread_messages(");

  assert.doesNotMatch(
    functionBody,
    /refresh_duo_chat_thread_lock_state/i
  );
  assert.match(functionBody, /limit v_limit \+ 1/i);
});
