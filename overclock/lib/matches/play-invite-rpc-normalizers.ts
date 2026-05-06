import type {
  ExpirePlayInvitesResult,
  PlayInviteStatus,
  SendPlayInviteResult,
  UpdatePlayInviteResult,
} from "@/lib/matches/play-invite-rpc-types";

function isPlayInviteStatus(value: unknown): value is PlayInviteStatus {
  return (
    value === "pending" ||
    value === "accepted" ||
    value === "declined" ||
    value === "expired" ||
    value === "cancelled"
  );
}

export function normalizeSendPlayInviteResult(
  value: unknown
): SendPlayInviteResult {
  if (typeof value === "string") {
    try {
      return normalizeSendPlayInviteResult(JSON.parse(value));
    } catch {
      return {
        created: false,
        errorCode: "invalid_response",
        inviteId: null,
      };
    }
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? normalizeSendPlayInviteResult(value[0])
      : {
          created: false,
          errorCode: "invalid_response",
          inviteId: null,
        };
  }

  if (!value || typeof value !== "object") {
    return {
      created: false,
      errorCode: "invalid_response",
      inviteId: null,
    };
  }

  const candidate = value as Record<string, unknown>;
  const nestedCandidate =
    candidate.send_play_invite &&
    typeof candidate.send_play_invite === "object" &&
    !Array.isArray(candidate.send_play_invite)
      ? (candidate.send_play_invite as Record<string, unknown>)
      : candidate;

  return {
    created: nestedCandidate.created === true,
    errorCode:
      typeof nestedCandidate.error_code === "string"
        ? nestedCandidate.error_code
        : null,
    inviteId:
      typeof nestedCandidate.invite_id === "string"
        ? nestedCandidate.invite_id
        : null,
  };
}

export function normalizeUpdatePlayInviteResult(
  value: unknown,
  functionName:
    | "accept_play_invite"
    | "decline_play_invite"
    | "cancel_play_invite"
): UpdatePlayInviteResult {
  if (typeof value === "string") {
    try {
      return normalizeUpdatePlayInviteResult(JSON.parse(value), functionName);
    } catch {
      return {
        errorCode: "invalid_response",
        inviteId: null,
        status: null,
        updated: false,
      };
    }
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? normalizeUpdatePlayInviteResult(value[0], functionName)
      : {
          errorCode: "invalid_response",
          inviteId: null,
          status: null,
          updated: false,
        };
  }

  if (!value || typeof value !== "object") {
    return {
      errorCode: "invalid_response",
      inviteId: null,
      status: null,
      updated: false,
    };
  }

  const candidate = value as Record<string, unknown>;
  const nestedCandidate =
    candidate[functionName] &&
    typeof candidate[functionName] === "object" &&
    !Array.isArray(candidate[functionName])
      ? (candidate[functionName] as Record<string, unknown>)
      : candidate;

  return {
    errorCode:
      typeof nestedCandidate.error_code === "string"
        ? nestedCandidate.error_code
        : null,
    inviteId:
      typeof nestedCandidate.invite_id === "string"
        ? nestedCandidate.invite_id
        : null,
    status: isPlayInviteStatus(nestedCandidate.status)
      ? nestedCandidate.status
      : null,
    updated: nestedCandidate.updated === true,
  };
}

export function normalizeExpirePlayInvitesResult(
  value: unknown
): ExpirePlayInvitesResult {
  if (typeof value === "string") {
    try {
      return normalizeExpirePlayInvitesResult(JSON.parse(value));
    } catch {
      return {
        errorCode: "invalid_response",
        expiredCount: 0,
      };
    }
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? normalizeExpirePlayInvitesResult(value[0])
      : {
          errorCode: "invalid_response",
          expiredCount: 0,
        };
  }

  if (!value || typeof value !== "object") {
    return {
      errorCode: "invalid_response",
      expiredCount: 0,
    };
  }

  const candidate = value as Record<string, unknown>;
  const nestedCandidate =
    candidate.expire_play_invites &&
    typeof candidate.expire_play_invites === "object" &&
    !Array.isArray(candidate.expire_play_invites)
      ? (candidate.expire_play_invites as Record<string, unknown>)
      : candidate;

  return {
    errorCode:
      typeof nestedCandidate.error_code === "string"
        ? nestedCandidate.error_code
        : null,
    expiredCount:
      typeof nestedCandidate.expired_count === "number"
        ? nestedCandidate.expired_count
        : 0,
  };
}
