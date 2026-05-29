import { CHAT_PAGE_SIZE } from "@/lib/chat/chat-constants";
import {
  getChatThreadMessagesRecord,
  getSocialThreadRecord,
  getSocialThreadsRecord,
} from "@/lib/chat/chat-records";
import type { ChatThreadPageDto, SocialPageDto } from "@/lib/chat/chat-types";
import { getProfileAvatarUrl } from "@/lib/profiles/profile-media";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";
import { createClient } from "@/lib/supabase/server";

async function getRequiredViewer() {
  const { user, profile } = await getCurrentProfile();
  return { user, profile };
}

type ChatPeerProfile = {
  avatarUrl: string | null;
  battlenetHandle: string | null;
  discordUsername: string | null;
};

async function getChatPeerProfiles(profileIds: string[]) {
  if (profileIds.length === 0) {
    return new Map<string, ChatPeerProfile>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, avatar_url, avatar_updated_at, discord_username, battlenet_handle"
    )
    .in("id", profileIds);

  if (error) {
    throw error;
  }

  const profiles = new Map<string, ChatPeerProfile>();

  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    if (typeof row.id !== "string") {
      continue;
    }

    profiles.set(row.id, {
      avatarUrl:
        typeof row.avatar_url === "string"
          ? getProfileAvatarUrl(
              row.avatar_url,
              typeof row.avatar_updated_at === "string"
                ? row.avatar_updated_at
                : null
            )
          : null,
      battlenetHandle:
        typeof row.battlenet_handle === "string" ? row.battlenet_handle : null,
      discordUsername:
        typeof row.discord_username === "string" ? row.discord_username : null,
    });
  }

  return profiles;
}

function mergePeerProfile<T extends SocialPageDto["threads"][number]>(
  thread: T,
  peerProfiles: Map<string, ChatPeerProfile>
): T {
  const peerProfile = peerProfiles.get(thread.peer.profileId);

  if (!peerProfile) {
    return thread;
  }

  return {
    ...thread,
    peer: {
      ...thread.peer,
      avatarUrl: peerProfile.avatarUrl ?? thread.peer.avatarUrl,
      battlenetHandle:
        peerProfile.battlenetHandle ?? thread.peer.battlenetHandle ?? null,
      discordUsername:
        peerProfile.discordUsername ?? thread.peer.discordUsername ?? null,
    },
  };
}

export async function getSocialPageDto(): Promise<SocialPageDto | null> {
  const { user, profile } = await getRequiredViewer();

  if (!user || !profile) {
    return null;
  }

  const { threads } = await getSocialThreadsRecord();
  const peerProfiles = await getChatPeerProfiles(
    Array.from(new Set(threads.map((thread) => thread.peer.profileId)))
  );

  return {
    threads: threads.map((thread) => mergePeerProfile(thread, peerProfiles)),
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

  const peerProfiles = await getChatPeerProfiles(
    Array.from(
      new Set([
        activeThread.peer.profileId,
        ...threadsResult.threads.map((thread) => thread.peer.profileId),
      ])
    )
  );
  const threads = threadsResult.threads.map((thread) =>
    mergePeerProfile(thread, peerProfiles)
  );
  const hydratedActiveThread = mergePeerProfile(activeThread, peerProfiles);

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
    activeThread: hydratedActiveThread,
    initialMessages,
  };
}
