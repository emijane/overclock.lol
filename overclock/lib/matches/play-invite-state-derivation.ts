import type {
  LFGInviteStateMap,
  ProfileInviteState,
} from "@/lib/matches/play-invite-types";

type LFGEligiblePost = {
  id: string;
  profileId: string;
};

type AcceptedInvitePair = {
  recipientProfileId: string;
  senderProfileId: string;
};

type PendingLFGInvite = {
  recipientProfileId: string;
  sourceLFGPostId: string;
};

export function deriveProfileInviteState(input: {
  acceptedCount: number | null | undefined;
  currentProfileId: string | null;
  pendingCount: number | null | undefined;
  targetProfileId: string;
}): ProfileInviteState {
  if (!input.currentProfileId || input.currentProfileId === input.targetProfileId) {
    return "invite_to_play";
  }

  if ((input.acceptedCount ?? 0) > 0) {
    return "matched";
  }

  if ((input.pendingCount ?? 0) > 0) {
    return "invite_sent";
  }

  return "invite_to_play";
}

export function deriveLFGInviteStates(input: {
  currentProfileId: string | null;
  pendingInvites: PendingLFGInvite[];
  posts: Array<{
    id: string;
    profileId: string | null;
  }>;
  acceptedPairs: AcceptedInvitePair[];
}): LFGInviteStateMap {
  const states: LFGInviteStateMap = {};

  for (const post of input.posts) {
    states[post.id] = "invite_to_play";
  }

  if (!input.currentProfileId) {
    return states;
  }

  const eligiblePosts = input.posts.filter(
    (post) => Boolean(post.profileId) && post.profileId !== input.currentProfileId
  ) as LFGEligiblePost[];

  if (eligiblePosts.length === 0) {
    return states;
  }

  const matchedRecipientIds = new Set<string>();

  for (const row of input.acceptedPairs) {
    matchedRecipientIds.add(
      row.senderProfileId === input.currentProfileId
        ? row.recipientProfileId
        : row.senderProfileId
    );
  }

  for (const post of eligiblePosts) {
    if (matchedRecipientIds.has(post.profileId)) {
      states[post.id] = "matched";
    }
  }

  for (const row of input.pendingInvites) {
    const matchingPost = eligiblePosts.find(
      (post) =>
        post.id === row.sourceLFGPostId && post.profileId === row.recipientProfileId
    );

    if (!matchingPost || states[matchingPost.id] === "matched") {
      continue;
    }

    states[matchingPost.id] = "invite_sent";
  }

  return states;
}
