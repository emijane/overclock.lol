"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/profiles/get-current-profile";
import { isCompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import {
  acceptStackRequestRecord,
  declineStackRequestRecord,
  leaveStackRecord,
  removeStackMemberRecord,
  sendStackJoinRequestRecord,
} from "@/lib/lfg/stack-requests";
import type {
  StackRequestErrorCode,
  StackRequestStatus,
} from "@/lib/lfg/stack-request-types";

type StackActionResponse = {
  success: boolean;
  errorCode: StackRequestErrorCode;
};

type StackJoinRequestActionResponse = StackActionResponse & {
  requestId: string | null;
};

type StackRequestUpdateActionResponse = StackActionResponse & {
  status: StackRequestStatus | null;
};

type StackMembershipUpdateActionResponse = StackActionResponse & {
  memberProfileId?: string | null;
  postId: string | null;
};

function getStackActionFailure(errorCode: StackRequestErrorCode = "invalid_response") {
  return {
    success: false,
    errorCode,
  } as const;
}

function logStackActionFailure(action: string, error: unknown, context: Record<string, string>) {
  console.error(`Stack action failed: ${action}`, {
    ...context,
    error,
  });
}

export async function sendStackJoinRequest(formData: FormData) {
  const postId = formData.get("post_id")?.toString().trim() ?? "";
  const requestedRoleValue = formData.get("requested_role")?.toString().trim() ?? "";

  if (!postId) {
    return { ...getStackActionFailure("invalid_post"), requestId: null };
  }

  if (!isCompetitiveRole(requestedRoleValue)) {
    return { ...getStackActionFailure("invalid_role"), requestId: null };
  }

  const { user } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  let result: Awaited<ReturnType<typeof sendStackJoinRequestRecord>>;

  try {
    result = await sendStackJoinRequestRecord({
      postId,
      requestedRole: requestedRoleValue,
    });
  } catch (error) {
    logStackActionFailure("sendStackJoinRequest", error, {
      postId,
      requestedRole: requestedRoleValue,
    });

    return {
      ...getStackActionFailure(),
      requestId: null,
    } satisfies StackJoinRequestActionResponse;
  }

  if (result.created) {
    revalidatePath("/stacks");
  }

  return {
    success: result.created,
    errorCode: result.errorCode,
    requestId: result.requestId,
  };
}

export async function acceptStackJoinRequest(formData: FormData) {
  const requestId = formData.get("request_id")?.toString().trim() ?? "";

  if (!requestId) {
    return { ...getStackActionFailure("invalid_request"), status: null };
  }

  const { user } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  let result: Awaited<ReturnType<typeof acceptStackRequestRecord>>;

  try {
    result = await acceptStackRequestRecord({ requestId });
  } catch (error) {
    logStackActionFailure("acceptStackJoinRequest", error, { requestId });

    return {
      ...getStackActionFailure(),
      status: null,
    } satisfies StackRequestUpdateActionResponse;
  }

  if (result.updated) {
    revalidatePath("/stacks");
  }

  return {
    success: result.updated,
    errorCode: result.errorCode,
    status: result.status,
  };
}

export async function leaveStack(formData: FormData) {
  const postId = formData.get("post_id")?.toString().trim() ?? "";

  if (!postId) {
    return { ...getStackActionFailure("invalid_post"), postId: null };
  }

  const { user } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  let result: Awaited<ReturnType<typeof leaveStackRecord>>;

  try {
    result = await leaveStackRecord({ postId });
  } catch (error) {
    logStackActionFailure("leaveStack", error, { postId });

    return {
      ...getStackActionFailure(),
      postId: null,
    } satisfies StackMembershipUpdateActionResponse;
  }

  if (result.updated) {
    revalidatePath("/stacks");
    revalidatePath("/account/posts");
  }

  return {
    success: result.updated,
    errorCode: result.errorCode,
    postId: result.postId,
  };
}

export async function removeStackMember(formData: FormData) {
  const postId = formData.get("post_id")?.toString().trim() ?? "";
  const memberProfileId = formData.get("member_profile_id")?.toString().trim() ?? "";

  if (!postId || !memberProfileId) {
    return {
      ...getStackActionFailure("invalid_member"),
      memberProfileId: null,
      postId: null,
    };
  }

  const { user } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  let result: Awaited<ReturnType<typeof removeStackMemberRecord>>;

  try {
    result = await removeStackMemberRecord({
      memberProfileId,
      postId,
    });
  } catch (error) {
    logStackActionFailure("removeStackMember", error, {
      memberProfileId,
      postId,
    });

    return {
      ...getStackActionFailure(),
      memberProfileId: null,
      postId: null,
    } satisfies StackMembershipUpdateActionResponse;
  }

  if (result.updated) {
    revalidatePath("/stacks");
    revalidatePath("/account/posts");
  }

  return {
    success: result.updated,
    errorCode: result.errorCode,
    memberProfileId: result.memberProfileId,
    postId: result.postId,
  };
}

export async function declineStackJoinRequest(formData: FormData) {
  const requestId = formData.get("request_id")?.toString().trim() ?? "";

  if (!requestId) {
    return { ...getStackActionFailure("invalid_request"), status: null };
  }

  const { user } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  let result: Awaited<ReturnType<typeof declineStackRequestRecord>>;

  try {
    result = await declineStackRequestRecord({ requestId });
  } catch (error) {
    logStackActionFailure("declineStackJoinRequest", error, { requestId });

    return {
      ...getStackActionFailure(),
      status: null,
    } satisfies StackRequestUpdateActionResponse;
  }

  return {
    success: result.updated,
    errorCode: result.errorCode,
    status: result.status,
  };
}
