"use server";

import { revalidatePath } from "next/cache";

import {
  acceptPlayInviteRecord,
  declinePlayInviteRecord,
  expirePlayInvitesRecord,
} from "@/lib/matches/play-invites";
import type { PlayInviteStatus } from "@/lib/matches/play-invite-rpc-types";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

export type UpdatePlayInviteActionResult =
  | { status: "success"; inviteId: string; inviteStatus: PlayInviteStatus }
  | { status: "unauthenticated" }
  | { status: "onboarding_required" }
  | { status: "error"; message: string };

function optionalTrimmedString(value: string | null | undefined) {
  const parsed = value?.trim() ?? "";
  return parsed.length > 0 ? parsed : null;
}

function mapPlayInviteUpdateErrorMessage(errorCode: string | null) {
  if (errorCode === "invite_expired") {
    return "That invite has already expired.";
  }

  if (errorCode === "invite_not_found" || errorCode === "invalid_invite") {
    return "That invite is no longer available.";
  }

  if (errorCode === "forbidden") {
    return "You do not have permission to update that invite.";
  }

  if (errorCode === "invalid_state") {
    return "That invite can no longer be updated.";
  }

  if (errorCode === "recipient_not_found") {
    return "That player cannot be updated right now.";
  }

  return "Unable to update that invite right now.";
}

function mapUpdatePlayInviteActionResult(input: {
  errorCode: string | null;
  inviteId: string | null;
  status: PlayInviteStatus | null;
  updated: boolean;
}): UpdatePlayInviteActionResult {
  if (input.updated && input.inviteId && input.status) {
    return {
      status: "success",
      inviteId: input.inviteId,
      inviteStatus: input.status,
    };
  }

  return {
    status: "error",
    message: mapPlayInviteUpdateErrorMessage(input.errorCode),
  };
}

async function requireCurrentProfile() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    return { profile: null, result: { status: "unauthenticated" as const } };
  }

  if (!profile) {
    return {
      profile: null,
      result: { status: "onboarding_required" as const },
    };
  }

  return { profile, result: null };
}

export async function acceptPlayInvite(input: {
  inviteId: string;
}): Promise<UpdatePlayInviteActionResult> {
  const requiredProfile = await requireCurrentProfile();

  if (requiredProfile.result) {
    return requiredProfile.result;
  }

  const profile = requiredProfile.profile;

  if (!profile) {
    return { status: "onboarding_required" };
  }

  const inviteId = optionalTrimmedString(input.inviteId);

  if (!inviteId) {
    return { status: "error", message: "Choose an invite to accept." };
  }

  try {
    const expireResult = await expirePlayInvitesRecord({ inviteId });

    if (expireResult.errorCode === "unauthenticated") {
      return { status: "unauthenticated" };
    }

    const result = await acceptPlayInviteRecord({ inviteId });
    const actionResult = mapUpdatePlayInviteActionResult(result);

    if (actionResult.status !== "success") {
      return actionResult;
    }

    revalidatePath("/matches");
    revalidatePath("/connections");

    return actionResult;
  } catch (error) {
    console.error("Play invite accept failed", {
      error,
      inviteId,
      profileId: profile.id,
    });

    return {
      status: "error",
      message: "Unable to accept that invite right now.",
    };
  }
}

export async function declinePlayInvite(input: {
  inviteId: string;
}): Promise<UpdatePlayInviteActionResult> {
  const requiredProfile = await requireCurrentProfile();

  if (requiredProfile.result) {
    return requiredProfile.result;
  }

  const profile = requiredProfile.profile;

  if (!profile) {
    return { status: "onboarding_required" };
  }

  const inviteId = optionalTrimmedString(input.inviteId);

  if (!inviteId) {
    return { status: "error", message: "Choose an invite to decline." };
  }

  try {
    const expireResult = await expirePlayInvitesRecord({ inviteId });

    if (expireResult.errorCode === "unauthenticated") {
      return { status: "unauthenticated" };
    }

    const result = await declinePlayInviteRecord({ inviteId });
    const actionResult = mapUpdatePlayInviteActionResult(result);

    if (actionResult.status !== "success") {
      return actionResult;
    }

    revalidatePath("/matches");
    revalidatePath("/connections");

    return actionResult;
  } catch (error) {
    console.error("Play invite decline failed", {
      error,
      inviteId,
      profileId: profile.id,
    });

    return {
      status: "error",
      message: "Unable to decline that invite right now.",
    };
  }
}
