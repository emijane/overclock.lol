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

export async function sendStackJoinRequest(formData: FormData) {
  const postId = formData.get("post_id")?.toString().trim() ?? "";
  const requestedRoleValue = formData.get("requested_role")?.toString().trim() ?? "";

  if (!postId) {
    return { success: false, errorCode: "invalid_post" as const };
  }

  if (!isCompetitiveRole(requestedRoleValue)) {
    return { success: false, errorCode: "invalid_role" as const };
  }

  const { user } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  const result = await sendStackJoinRequestRecord({
    postId,
    requestedRole: requestedRoleValue,
  });

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
    return { success: false, errorCode: "invalid_request" as const };
  }

  const { user } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  const result = await acceptStackRequestRecord({ requestId });

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
    return { success: false, errorCode: "invalid_post" as const };
  }

  const { user } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  const result = await leaveStackRecord({ postId });

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
    return { success: false, errorCode: "invalid_member" as const };
  }

  const { user } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  const result = await removeStackMemberRecord({
    memberProfileId,
    postId,
  });

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
    return { success: false, errorCode: "invalid_request" as const };
  }

  const { user } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  const result = await declineStackRequestRecord({ requestId });

  return {
    success: result.updated,
    errorCode: result.errorCode,
    status: result.status,
  };
}
