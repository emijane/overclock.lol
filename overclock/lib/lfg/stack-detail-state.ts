import type { StackPostDetail } from "@/lib/lfg/posts/posts-queries";

export function getStackInactiveStateCopy(detail: StackPostDetail) {
  if (detail.post.status === "closed") {
    return {
      description:
        "This stack has been closed, so join and management actions are no longer available.",
      title: "This stack is closed",
    };
  }

  if (detail.post.status === "expired" || detail.isExpired) {
    return {
      description:
        "This stack has expired and is no longer visible as an active listing in the feed.",
      title: "This stack has expired",
    };
  }

  return {
    description: "This stack is no longer available for active membership actions.",
    title: "This stack is not active",
  };
}

export function deriveStackDetailViewerState(input: {
  currentProfileId: string | null;
  detail: StackPostDetail;
}) {
  const { currentProfileId, detail } = input;
  const isOwner = Boolean(
    currentProfileId && detail.post.profileId === currentProfileId
  );
  const isAcceptedMember = Boolean(
    currentProfileId &&
      detail.post.stackMembers.some(
        (member) => member.profileId === currentProfileId
      )
  );

  return {
    isAcceptedMember,
    isOwner,
    shouldFetchContactInfo: Boolean(
      currentProfileId && (isOwner || isAcceptedMember)
    ),
    shouldFetchIncomingRequests: Boolean(
      currentProfileId && isOwner && detail.isActive
    ),
    shouldFetchRequestState: Boolean(
      currentProfileId && !isOwner && !isAcceptedMember && detail.isActive
    ),
  };
}
