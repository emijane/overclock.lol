import type { ChatMessageRecord } from "@/lib/chat/chat-types";

export function mergeChatMessages(
  current: ChatMessageRecord[],
  incoming: ChatMessageRecord[]
) {
  const byId = new Map(current.map((message) => [message.id, message]));

  for (const message of incoming) {
    byId.set(message.id, message);
  }

  return Array.from(byId.values()).sort((a, b) => {
    const createdDiff =
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

    if (createdDiff !== 0) {
      return createdDiff;
    }

    return a.id.localeCompare(b.id);
  });
}
