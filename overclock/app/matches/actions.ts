"use server";

import { revalidatePath } from "next/cache";

import { sendPlayInviteRecord } from "@/lib/matches/play-invites";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

export type SendPlayInviteActionResult =
  | { status: "success"; inviteId: string }
  | { status: "unauthenticated" }
  | { status: "onboarding_required" }
  | { status: "error"; message: string };

function optionalTrimmedString(value: string | null | undefined) {
  const parsed = value?.trim() ?? "";
  return parsed.length > 0 ? parsed : null;
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
