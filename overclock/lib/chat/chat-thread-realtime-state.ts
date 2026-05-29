export type ChatThreadRealtimeRefreshState = "errored" | "timed_out";

export function getChatThreadRealtimeRefreshState(
  status: string
): ChatThreadRealtimeRefreshState | null {
  if (status === "CHANNEL_ERROR") {
    return "errored";
  }

  if (status === "TIMED_OUT") {
    return "timed_out";
  }

  return null;
}
