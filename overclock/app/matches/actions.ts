"use server";

import { revalidatePath } from "next/cache";

import {
  mapExpirePlayInvitesActionResult,
  mapSendPlayInviteActionResult,
  mapUpdatePlayInviteActionResult,
  optionalTrimmedString,
  type ExpirePlayInvitesActionResult,
  type SendPlayInviteActionResult,
  type UpdatePlayInviteActionResult,
} from "@/app/matches/play-invite-action-helpers";
import {
  acceptPlayInviteRecord,
  cancelPlayInviteRecord,
  declinePlayInviteRecord,
  expirePlayInvitesRecord,
  sendPlayInviteRecord,
} from "@/lib/matches/play-invites";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";
export type {
  ExpirePlayInvitesActionResult,
  SendPlayInviteActionResult,
  UpdatePlayInviteActionResult,
} from "@/app/matches/play-invite-action-helpers";

export async function sendPlayInvite(input: {
  message?: string | null;
  recipientProfileId: string;
  sourceLFGPostId?: string | null;
}): Promise<SendPlayInviteActionResult> {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    return { status: "unauthenticated" };
  }

  if (!profile) {
    return { status: "onboarding_required" };
  }

  const recipientProfileId = optionalTrimmedString(input.recipientProfileId);

  if (!recipientProfileId) {
    return { status: "error", message: "Choose a player to invite." };
  }

  try {
    const result = await sendPlayInviteRecord({
      message: optionalTrimmedString(input.message),
      recipientProfileId,
      sourceLFGPostId: optionalTrimmedString(input.sourceLFGPostId),
    });

    const actionResult = mapSendPlayInviteActionResult(result);

    if (actionResult.status !== "success") {
      return actionResult;
    }

    revalidatePath("/matches");

    return actionResult;
  } catch (error) {
    console.error("Play invite send failed", {
      error,
      profileId: profile.id,
      recipientProfileId,
      sourceLFGPostId: input.sourceLFGPostId ?? null,
    });

    return {
      status: "error",
      message: "Unable to send that invite right now.",
    };
  }
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

export async function cancelPlayInvite(input: {
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
    return { status: "error", message: "Choose an invite to cancel." };
  }

  try {
    const expireResult = await expirePlayInvitesRecord({ inviteId });

    if (expireResult.errorCode === "unauthenticated") {
      return { status: "unauthenticated" };
    }

    const result = await cancelPlayInviteRecord({ inviteId });

    const actionResult = mapUpdatePlayInviteActionResult(result);

    if (actionResult.status !== "success") {
      return actionResult;
    }

    revalidatePath("/matches");

    return actionResult;
  } catch (error) {
    console.error("Play invite cancel failed", {
      error,
      inviteId,
      profileId: profile.id,
    });

    return {
      status: "error",
      message: "Unable to cancel that invite right now.",
    };
  }
}

export async function expirePlayInvites(input?: {
  inviteId?: string | null;
}): Promise<ExpirePlayInvitesActionResult> {
  const requiredProfile = await requireCurrentProfile();

  if (requiredProfile.result) {
    return requiredProfile.result;
  }

  const profile = requiredProfile.profile;

  if (!profile) {
    return { status: "onboarding_required" };
  }

  try {
    const result = await expirePlayInvitesRecord({
      inviteId: optionalTrimmedString(input?.inviteId),
    });

    const actionResult = mapExpirePlayInvitesActionResult(result);

    if (actionResult.status !== "success") {
      return actionResult;
    }

    revalidatePath("/matches");

    return actionResult;
  } catch (error) {
    console.error("Play invite expiry sweep failed", {
      error,
      inviteId: input?.inviteId ?? null,
      profileId: profile.id,
    });

    return {
      status: "error",
      message: "Unable to expire invites right now.",
    };
  }
}
