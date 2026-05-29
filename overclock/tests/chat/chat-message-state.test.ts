import test from "node:test";
import assert from "node:assert/strict";

import { mergeChatMessages } from "../../lib/chat/chat-message-state";
import type { ChatMessageRecord } from "../../lib/chat/chat-types";

function createMessage(input: {
  body?: string;
  createdAt: string;
  id: string;
}): ChatMessageRecord {
  return {
    body: input.body ?? input.id,
    createdAt: input.createdAt,
    id: input.id,
    sender: {
      avatarUrl: null,
      displayName: "Player",
      profileId: "profile-1",
      username: "player",
    },
    threadId: "thread-1",
    updatedAt: input.createdAt,
  };
}

test("mergeChatMessages keeps chronological order across pages", () => {
  const current = [
    createMessage({ createdAt: "2026-05-28T12:05:00.000Z", id: "message-3" }),
    createMessage({ createdAt: "2026-05-28T12:10:00.000Z", id: "message-4" }),
  ];
  const olderPage = [
    createMessage({ createdAt: "2026-05-28T11:55:00.000Z", id: "message-1" }),
    createMessage({ createdAt: "2026-05-28T12:00:00.000Z", id: "message-2" }),
  ];

  assert.deepEqual(
    mergeChatMessages(current, olderPage).map((message) => message.id),
    ["message-1", "message-2", "message-3", "message-4"]
  );
});

test("mergeChatMessages removes duplicate ids from overlapping pages and realtime", () => {
  const current = [
    createMessage({ createdAt: "2026-05-28T12:00:00.000Z", id: "message-1" }),
    createMessage({ createdAt: "2026-05-28T12:05:00.000Z", id: "message-2" }),
  ];
  const overlapping = [
    createMessage({ createdAt: "2026-05-28T12:05:00.000Z", id: "message-2", body: "new body" }),
    createMessage({ createdAt: "2026-05-28T12:10:00.000Z", id: "message-3" }),
  ];

  const merged = mergeChatMessages(current, overlapping);

  assert.deepEqual(
    merged.map((message) => message.id),
    ["message-1", "message-2", "message-3"]
  );
  assert.equal(merged[1]?.body, "new body");
});
