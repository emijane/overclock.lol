import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";

export type StackRequestStatus = "pending" | "accepted" | "declined";

export type StackRequestErrorCode =
  | "blocked_users"
  | "already_in_active_stack"
  | "already_member"
  | "duplicate_pending_request"
  | "duplicate_stack_membership"
  | "invalid_member"
  | "invalid_post"
  | "invalid_post_type"
  | "invalid_request"
  | "invalid_role"
  | "invalid_state"
  | "invalid_response"
  | "own_post"
  | "post_expired"
  | "post_not_active"
  | "post_not_found"
  | "rate_limited"
  | "request_cancelled"
  | "requester_not_found"
  | "request_not_found"
  | "role_not_needed"
  | "stack_full"
  | "unauthenticated"
  | "forbidden";

export type IncomingPendingStackRequest = {
  createdAt: string;
  id: string;
  postId: string;
  postTitle: string;
  requestedRole: CompetitiveRole;
  requester: {
    avatarUrl: string | null;
    displayName: string | null;
    profileId: string;
    rankDivision: number | null;
    rankTier: string | null;
    username: string | null;
  };
};

export type SendStackRequestResult = {
  created: boolean;
  errorCode: StackRequestErrorCode | null;
  requestId: string | null;
};

export type UpdateStackRequestResult = {
  updated: boolean;
  errorCode: StackRequestErrorCode | null;
  requestId: string | null;
  status: StackRequestStatus | null;
};

export type UpdateStackMembershipResult = {
  updated: boolean;
  errorCode: StackRequestErrorCode | null;
  memberProfileId: string | null;
  postId: string | null;
};
