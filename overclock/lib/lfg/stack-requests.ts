import { createClient } from "@/lib/supabase/server";
import { getProfileAvatarUrl } from "@/lib/profiles/profile-media";
import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import type {
  IncomingPendingStackRequest,
  SendStackRequestResult,
  StackRequestErrorCode,
  UpdateStackMembershipResult,
  UpdateStackRequestResult,
} from "./stack-request-types";

function normalizeErrorCode(value: unknown): StackRequestErrorCode | null {
  return typeof value === "string" ? (value as StackRequestErrorCode) : null;
}

function normalizeRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string") {
    try {
      return normalizeRecord(JSON.parse(value));
    } catch {
      return null;
    }
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? normalizeRecord(value[0]) : null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function unwrapRpcRecord(
  value: unknown,
  preferredKey: string
): Record<string, unknown> | null {
  const record = normalizeRecord(value);

  if (!record) {
    return null;
  }

  const nested =
    preferredKey in record &&
    typeof record[preferredKey] === "object" &&
    record[preferredKey] !== null &&
    !Array.isArray(record[preferredKey])
      ? (record[preferredKey] as Record<string, unknown>)
      : record;

  return nested;
}

function normalizeSendStackRequestResult(value: unknown): SendStackRequestResult {
  const nested = unwrapRpcRecord(value, "send_stack_request");

  if (!nested) {
    return { created: false, errorCode: "invalid_response", requestId: null };
  }

  return {
    created: nested.created === true,
    errorCode: normalizeErrorCode(nested.error_code),
    requestId: typeof nested.request_id === "string" ? nested.request_id : null,
  };
}

function normalizeUpdateStackRequestResult(value: unknown): UpdateStackRequestResult {
  const record = normalizeRecord(value);

  if (!record) {
    return { updated: false, errorCode: "invalid_response", requestId: null, status: null };
  }

  const rpcKey = Object.keys(record).find((key) => key.endsWith("_stack_request"));
  const nested =
    rpcKey &&
    typeof record[rpcKey] === "object" &&
    record[rpcKey] !== null &&
    !Array.isArray(record[rpcKey])
      ? (record[rpcKey] as Record<string, unknown>)
      : record;

  const status = nested.status;

  return {
    updated: nested.updated === true,
    errorCode: normalizeErrorCode(nested.error_code),
    requestId: typeof nested.request_id === "string" ? nested.request_id : null,
    status:
      status === "accepted" || status === "declined" || status === "pending"
        ? status
        : null,
  };
}

function normalizeUpdateStackMembershipResult(
  value: unknown,
  rpcKey: string
): UpdateStackMembershipResult {
  const nested = unwrapRpcRecord(value, rpcKey);

  if (!nested) {
    return {
      updated: false,
      errorCode: "invalid_response",
      memberProfileId: null,
      postId: null,
    };
  }

  return {
    updated: nested.updated === true,
    errorCode: normalizeErrorCode(nested.error_code),
    memberProfileId:
      typeof nested.member_profile_id === "string" ? nested.member_profile_id : null,
    postId: typeof nested.post_id === "string" ? nested.post_id : null,
  };
}

export async function expireStackPostsRecord() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("expire_stack_posts");

  if (error) {
    throw error;
  }
}

export async function sendStackJoinRequestRecord(input: {
  postId: string;
  requestedRole: CompetitiveRole;
}): Promise<SendStackRequestResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("send_stack_request", {
    p_post_id: input.postId,
    p_requested_role: input.requestedRole,
  });

  if (error) {
    throw error;
  }

  return normalizeSendStackRequestResult(data);
}

export async function acceptStackRequestRecord(input: {
  requestId: string;
}): Promise<UpdateStackRequestResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_stack_request", {
    p_request_id: input.requestId,
  });

  if (error) {
    throw error;
  }

  return normalizeUpdateStackRequestResult(data);
}

export async function declineStackRequestRecord(input: {
  requestId: string;
}): Promise<UpdateStackRequestResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("decline_stack_request", {
    p_request_id: input.requestId,
  });

  if (error) {
    throw error;
  }

  return normalizeUpdateStackRequestResult(data);
}

export async function leaveStackRecord(input: {
  postId: string;
}): Promise<UpdateStackMembershipResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("leave_stack", {
    p_post_id: input.postId,
  });

  if (error) {
    throw error;
  }

  return normalizeUpdateStackMembershipResult(data, "leave_stack");
}

export async function removeStackMemberRecord(input: {
  memberProfileId: string;
  postId: string;
}): Promise<UpdateStackMembershipResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("remove_stack_member", {
    p_member_profile_id: input.memberProfileId,
    p_post_id: input.postId,
  });

  if (error) {
    throw error;
  }

  return normalizeUpdateStackMembershipResult(data, "remove_stack_member");
}

export async function getIncomingPendingStackRequests(input: {
  currentProfileId: string;
}): Promise<{ requests: IncomingPendingStackRequest[]; totalCount: number }> {
  await expireStackPostsRecord();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stack_requests")
    .select(
      [
        "id",
        "post_id",
        "requested_role",
        "requester_profile_id",
        "created_at",
        "lfg_posts:post_id(title,status)",
        "requester:requester_profile_id(id,username,display_name,avatar_url,avatar_updated_at,current_rank_tier,current_rank_division)",
      ].join(",")
    )
    .eq("owner_profile_id", input.currentProfileId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  const rows = ((data ?? []) as unknown) as Array<Record<string, unknown>>;
  const requests: IncomingPendingStackRequest[] = [];

  for (const row of rows) {
    if (typeof row.id !== "string" || typeof row.post_id !== "string") {
      continue;
    }

    const postRow =
      row.lfg_posts && typeof row.lfg_posts === "object" && !Array.isArray(row.lfg_posts)
        ? (row.lfg_posts as Record<string, unknown>)
        : null;

    const requesterRow =
      row.requester && typeof row.requester === "object" && !Array.isArray(row.requester)
        ? (row.requester as Record<string, unknown>)
        : null;

    if (postRow?.status !== "active" && postRow?.status !== "filled") {
      continue;
    }

    const role = row.requested_role;
    if (role !== "tank" && role !== "dps" && role !== "support") {
      continue;
    }

    const requesterId =
      requesterRow && typeof requesterRow.id === "string"
        ? requesterRow.id
        : typeof row.requester_profile_id === "string"
          ? row.requester_profile_id
          : null;

    if (!requesterId) {
      continue;
    }

    requests.push({
      createdAt: typeof row.created_at === "string" ? row.created_at : "",
      id: row.id,
      postId: row.post_id,
      postTitle:
        postRow && typeof postRow.title === "string" ? postRow.title : "Stack",
      requestedRole: role,
      requester: {
        avatarUrl: requesterRow
          ? getProfileAvatarUrl(
              typeof requesterRow.avatar_url === "string" ? requesterRow.avatar_url : null,
              typeof requesterRow.avatar_updated_at === "string"
                ? requesterRow.avatar_updated_at
                : null
            )
          : null,
        displayName:
          requesterRow && typeof requesterRow.display_name === "string"
            ? requesterRow.display_name
            : null,
        profileId: requesterId,
        rankDivision:
          requesterRow && typeof requesterRow.current_rank_division === "number"
            ? requesterRow.current_rank_division
            : null,
        rankTier:
          requesterRow && typeof requesterRow.current_rank_tier === "string"
            ? requesterRow.current_rank_tier
            : null,
        username:
          requesterRow && typeof requesterRow.username === "string"
            ? requesterRow.username
            : null,
      },
    });
  }

  return { requests, totalCount: requests.length };
}

export async function getStackRequestStateForPost(input: {
  currentProfileId: string;
  postId: string;
}): Promise<"none" | "pending" | "accepted" | "declined"> {
  const states = await getStackRequestStatesForPosts({
    currentProfileId: input.currentProfileId,
    postIds: [input.postId],
  });

  return states[input.postId] ?? "none";
}

export async function getStackRequestStatesForPosts(input: {
  currentProfileId: string;
  postIds: string[];
}): Promise<Record<string, "none" | "pending" | "accepted" | "declined">> {
  if (input.postIds.length === 0) {
    return {};
  }

  await expireStackPostsRecord();

  const supabase = await createClient();
  const result: Record<string, "none" | "pending" | "accepted" | "declined"> = {};

  for (const id of input.postIds) {
    result[id] = "none";
  }

  const [membershipResult, requestResult] = await Promise.all([
    supabase
      .from("stack_members")
      .select("post_id")
      .in("post_id", input.postIds)
      .eq("profile_id", input.currentProfileId)
      .is("removed_at", null),
    supabase
      .from("stack_requests")
      .select("post_id,status")
      .in("post_id", input.postIds)
      .eq("requester_profile_id", input.currentProfileId)
      .order("created_at", { ascending: false }),
  ]);

  if (membershipResult.error) {
    throw membershipResult.error;
  }

  if (requestResult.error) {
    throw requestResult.error;
  }

  for (const row of ((membershipResult.data ?? []) as Array<Record<string, unknown>>)) {
    const postId = typeof row.post_id === "string" ? row.post_id : null;
    if (postId) {
      result[postId] = "accepted";
    }
  }

  for (const row of ((requestResult.data ?? []) as Array<Record<string, unknown>>)) {
    const postId = typeof row.post_id === "string" ? row.post_id : null;
    if (!postId || result[postId] === "accepted") {
      continue;
    }

    const status = row.status;
    if (
      (status === "pending" || status === "declined") &&
      result[postId] === "none"
    ) {
      result[postId] = status;
    }
  }

  return result;
}
