import test from "node:test";
import assert from "node:assert/strict";

import { getChatThreadRealtimeRefreshState } from "../../lib/chat/chat-thread-realtime-state";

test("chat thread realtime only refreshes for degraded channel states", () => {
  assert.equal(getChatThreadRealtimeRefreshState("CHANNEL_ERROR"), "errored");
  assert.equal(getChatThreadRealtimeRefreshState("TIMED_OUT"), "timed_out");
  assert.equal(getChatThreadRealtimeRefreshState("CLOSED"), null);
  assert.equal(getChatThreadRealtimeRefreshState("SUBSCRIBED"), null);
});
