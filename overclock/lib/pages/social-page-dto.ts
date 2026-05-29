import { CHAT_PAGE_SIZE } from "@/lib/chat/chat-constants";
import {
  getChatThreadMessagesRecord,
  getSocialThreadRecord,
  getSocialThreadsRecord,
} from "@/lib/chat/chat-records";
import type { ChatThreadPageDto, SocialPageDto } from "@/lib/chat/chat-types";
import { getProfileAvatarUrl } from "@/lib/profiles/profile-media";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

async function getRequiredViewer() {
  const { user, profile } = await getCurrentProfile();
  return { user, profile };
}

export async function getSocialPageDto(): Promise<SocialPageDto | null> {
  const { user, profile } = await getRequiredViewer();

  if (!user || !profile) {
    return null;
  }

  const { threads } = await getSocialThreadsRecord();

  return {
    threads,
    viewer: {
      avatarUrl:
        profile.discord_avatar_url ??
        getProfileAvatarUrl(profile.avatar_url, profile.avatar_updated_at),
      displayName: profile.display_name,
      profileId: profile.id,
      username: profile.username,
    },
  };
}

export async function getChatThreadPageDto(
  threadId: string
): Promise<ChatThreadPageDto | null> {
  const { user, profile } = await getRequiredViewer();

  if (!user || !profile) {
    return null;
  }

  const [threadsResult, activeThread, initialMessages] = await Promise.all([
    getSocialThreadsRecord(),
    getSocialThreadRecord(threadId),
    getChatThreadMessagesRecord({
      limit: CHAT_PAGE_SIZE,
      threadId,
    }),
  ]);

  if (!activeThread || !initialMessages.isAccessible) {
    return null;
  }

  return {
    threads: threadsResult.threads,
    viewer: {
      avatarUrl:
        profile.discord_avatar_url ??
        getProfileAvatarUrl(profile.avatar_url, profile.avatar_updated_at),
      displayName: profile.display_name,
      profileId: profile.id,
      username: profile.username,
    },
    activeThread,
    initialMessages,
  };
}
