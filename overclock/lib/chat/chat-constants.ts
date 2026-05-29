export const MAX_CHAT_MESSAGE_LENGTH = 1000;
export const CHAT_PAGE_SIZE = 50;
export const CHAT_RATE_LIMIT_MESSAGES = 5;
export const CHAT_RATE_LIMIT_WINDOW_SECONDS = 10;

export const CHAT_THREAD_LOCK_REASONS = [
  "connection_removed",
  "blocked",
  "invalid_source",
  "archived",
  "manual",
] as const;
