import type {
  ExpirePlayInvitesResult,
  PlayInviteStatus,
  RemoveProfileConnectionResult,
  SendPlayInviteResult,
  UpdatePlayInviteResult,
} from "@/lib/matches/play-invite-rpc-types";

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

export type RemoveProfileConnectionActionResult =
  | { status: "success"; connectionId: string }
  | { status: "unauthenticated" }
  | { status: "onboarding_required" }
  | { status: "error"; message: string };

export function optionalTrimmedString(value: string | null | undefined) {
  const parsed = value?.trim() ?? "";
  return parsed.length > 0 ? parsed : null;
}

export function mapPlayInviteUpdateErrorMessage(errorCode: string | null) {
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

export function mapSendPlayInviteActionResult(
  result: SendPlayInviteResult
): SendPlayInviteActionResult {
  if (result.created && result.inviteId) {
    return {
      status: "success",
      inviteId: result.inviteId,
    };
  }

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
    result.errorCode === "already_connected" ||
    result.errorCode === "invalid_recipient" ||
    result.errorCode === "recipient_not_found" ||
    result.errorCode === "self_invite"
  ) {
    return {
      status: "error",
      message:
        result.errorCode === "already_connected"
          ? "You are already connected with this player."
          : "That player cannot be invited right now.",
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

export function mapUpdatePlayInviteActionResult(
  result: UpdatePlayInviteResult
): UpdatePlayInviteActionResult {
  if (result.updated && result.inviteId && result.status) {
    return {
      status: "success",
      inviteId: result.inviteId,
      inviteStatus: result.status,
    };
  }

  return {
    status: "error",
    message: mapPlayInviteUpdateErrorMessage(result.errorCode),
  };
}

export function mapExpirePlayInvitesActionResult(
  result: ExpirePlayInvitesResult
): ExpirePlayInvitesActionResult {
  if (result.errorCode === "unauthenticated") {
    return { status: "unauthenticated" };
  }

  if (result.errorCode) {
    return {
      status: "error",
      message: "Unable to expire invites right now.",
    };
  }

  return {
    status: "success",
    expiredCount: result.expiredCount,
  };
}

export function mapRemoveProfileConnectionActionResult(
  result: RemoveProfileConnectionResult
): RemoveProfileConnectionActionResult {
  if (result.updated && result.connectionId) {
    return {
      status: "success",
      connectionId: result.connectionId,
    };
  }

  if (result.errorCode === "unauthenticated") {
    return { status: "unauthenticated" };
  }

  if (
    result.errorCode === "connection_not_found" ||
    result.errorCode === "invalid_connection"
  ) {
    return {
      status: "error",
      message: "That connection is no longer available.",
    };
  }

  if (result.errorCode === "forbidden") {
    return {
      status: "error",
      message: "You do not have permission to update that connection.",
    };
  }

  if (result.errorCode === "invalid_state") {
    return {
      status: "error",
      message: "That connection has already been removed.",
    };
  }

  return {
    status: "error",
    message: "Unable to remove that connection right now.",
  };
}
