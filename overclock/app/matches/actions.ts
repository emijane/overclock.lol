"use server";

import { revalidatePath } from "next/cache";

import {
  acceptPlayInviteRecord,
  cancelPlayInviteRecord,
  declinePlayInviteRecord,
  expirePlayInvitesRecord,
  sendPlayInviteRecord,
  type PlayInviteStatus,
} from "@/lib/matches/play-invites";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

export type SendPlayInviteActionResult =
  | { status: "success"; inviteId: string }
  | { status: "unauthenticated" }
  | { status: "onboarding_required" }
  | { status: "error"; message: string };

export type UpdatePlayInviteActionResult =
  | { status: "success"; inviteId: string; inviteStatus: PlayInviteStatus }
  | { status: "unauthenticated" }
  | { status: "onboarding_required" }
  | { status: "error"; message: string };

export type ExpirePlayInvitesActionResult =
  | { status: "success"; expiredCount: number }
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

    if (!result.created || !result.inviteId) {
      if (result.errorCode === "duplicate_pending_invite") {
        return {
          status: "error",
          message: "You already have a pending invite out to this player.",
        };
      }

      if (
        result.errorCode === "send_rate_limited" ||
        result.errorCode === "recipient_rate_limited"
      ) {
        return {
          status: "error",
          message: "You are sending invites too quickly right now.",
        };
      }

      if (
        result.errorCode === "invalid_recipient" ||
        result.errorCode === "recipient_not_found" ||
        result.errorCode === "self_invite"
      ) {
        return {
          status: "error",
          message: "That player cannot be invited right now.",
        };
      }

      if (result.errorCode === "invalid_source_post") {
        return {
          status: "error",
          message: "That post is no longer available for invites.",
        };
      }

      if (result.errorCode === "invalid_message") {
        return {
          status: "error",
          message: "Invite messages must be 280 characters or fewer.",
        };
      }

      if (
        result.errorCode === "unauthenticated" ||
        result.errorCode === "sender_not_found"
      ) {
        return { status: "unauthenticated" };
      }

      return {
        status: "error",
        message: "Unable to send that invite right now.",
      };
    }

    revalidatePath("/matches");

    return {
      status: "success",
      inviteId: result.inviteId,
    };
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

    if (!result.updated || !result.inviteId || !result.status) {
      return {
        status: "error",
        message: mapPlayInviteUpdateErrorMessage(result.errorCode),
      };
    }

    revalidatePath("/matches");

    return {
      status: "success",
      inviteId: result.inviteId,
      inviteStatus: result.status,
    };
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

    if (!result.updated || !result.inviteId || !result.status) {
      return {
        status: "error",
        message: mapPlayInviteUpdateErrorMessage(result.errorCode),
      };
    }

    revalidatePath("/matches");

    return {
      status: "success",
      inviteId: result.inviteId,
      inviteStatus: result.status,
    };
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

    if (!result.updated || !result.inviteId || !result.status) {
      return {
        status: "error",
        message: mapPlayInviteUpdateErrorMessage(result.errorCode),
      };
    }

    revalidatePath("/matches");

    return {
      status: "success",
      inviteId: result.inviteId,
      inviteStatus: result.status,
    };
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

    if (result.errorCode === "unauthenticated") {
      return { status: "unauthenticated" };
    }

    if (result.errorCode) {
      return {
        status: "error",
        message: "Unable to expire invites right now.",
      };
    }

    revalidatePath("/matches");

    return {
      status: "success",
      expiredCount: result.expiredCount,
    };
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
