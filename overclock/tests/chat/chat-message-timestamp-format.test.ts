import assert from "node:assert/strict";
import test from "node:test";

import { getFormattedMessageTimestamp } from "@/features/chat/components/chat-message-list";

test("keeps same-day chat timestamps as time only", () => {
  const now = new Date("2026-05-29T20:00:00.000Z");
  const messageDate = new Date("2026-05-29T15:14:00.000Z");

  assert.equal(
    getFormattedMessageTimestamp(messageDate.toISOString(), now),
    messageDate.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })
  );
});

test("switches prior-day chat timestamps to month and day", () => {
  const now = new Date("2026-05-29T20:00:00.000Z");
  const messageDate = new Date("2026-05-28T23:14:00.000Z");

  assert.equal(
    getFormattedMessageTimestamp(messageDate.toISOString(), now),
    messageDate.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })
  );
});

test("keeps older same-year chat timestamps as month and day", () => {
  const now = new Date("2026-05-29T20:00:00.000Z");
  const messageDate = new Date("2026-01-10T18:45:00.000Z");

  assert.equal(
    getFormattedMessageTimestamp(messageDate.toISOString(), now),
    messageDate.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })
  );
});

test("adds the year for prior-year chat timestamps", () => {
  const now = new Date("2026-05-29T20:00:00.000Z");
  const messageDate = new Date("2025-12-31T23:14:00.000Z");

  assert.equal(
    getFormattedMessageTimestamp(messageDate.toISOString(), now),
    messageDate.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  );
});
