"use server";

import { revalidatePath } from "next/cache";

import { matchesPerfLog, stacksPerfStart } from "@/lib/dev/perf-log";
import {
  acceptPlayInviteRecord,
  cancelPlayInviteRecord,
  declinePlayInviteRecord,
  expirePlayInvitesRecord,
  removeProfileConnectionRecord,
  sendPlayInviteRecord,
} from "@/lib/matches/play-invites";
import { getCurrentProfileIdentity } from "@/lib/profiles/get-current-profile";
import {
  mapExpirePlayInvitesActionResult,
  mapRemoveProfileConnectionActionResult,
  mapSendPlayInviteActionResult,
  mapUpdatePlayInviteActionResult,
  optionalTrimmedString,
  type ExpirePlayInvitesActionResult,
  type RemoveProfileConnectionActionResult,
  type SendPlayInviteActionResult,
  type UpdatePlayInviteActionResult,
} from "@/features/matches/play-invite-action-helpers";

export type {
  ExpirePlayInvitesActionResult,
  RemoveProfileConnectionActionResult,
  SendPlayInviteActionResult,
  UpdatePlayInviteActionResult,
} from "@/features/matches/play-invite-action-helpers";

async function requireCurrentProfile() {
  const { user, profile } = await getCurrentProfileIdentity();

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

function logMatchesAction(label: string, start: number, rows?: number) {
  matchesPerfLog(label, start, rows);
}

export async function sendPlayInvite(input: {
  message?: string | null;
  recipientProfileId: string;
  sourceLFGPostId?: string | null;
}): Promise<SendPlayInviteActionResult> {
  const tAction = stacksPerfStart();
  const tAuth = stacksPerfStart();
  const { user, profile } = await getCurrentProfileIdentity();
  logMatchesAction("sendPlayInvite auth+profile", tAuth, profile ? 1 : 0);

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
    const tRpc = stacksPerfStart();
    const result = await sendPlayInviteRecord({
      message: optionalTrimmedString(input.message),
      recipientProfileId,
      sourceLFGPostId: optionalTrimmedString(input.sourceLFGPostId),
    });
    logMatchesAction("sendPlayInvite rpc", tRpc, result.created ? 1 : 0);

    const actionResult = mapSendPlayInviteActionResult(result);

    if (actionResult.status !== "success") {
      logMatchesAction("sendPlayInvite total", tAction, 0);
      return actionResult;
    }

    const tRevalidate = stacksPerfStart();
    revalidatePath("/matches");
    logMatchesAction("sendPlayInvite revalidate", tRevalidate);
    logMatchesAction("sendPlayInvite total", tAction, 1);

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

export async function acceptPlayInvite(input: {
  inviteId: string;
}): Promise<UpdatePlayInviteActionResult> {
  const tAction = stacksPerfStart();
  const tAuth = stacksPerfStart();
  const requiredProfile = await requireCurrentProfile();
  logMatchesAction("acceptPlayInvite auth+profile", tAuth, requiredProfile.profile ? 1 : 0);

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
    const tExpire = stacksPerfStart();
    const expireResult = await expirePlayInvitesRecord({ inviteId });
    logMatchesAction("acceptPlayInvite expire sweep", tExpire, expireResult.expiredCount);

    if (expireResult.errorCode === "unauthenticated") {
      return { status: "unauthenticated" };
    }

    const tRpc = stacksPerfStart();
    const result = await acceptPlayInviteRecord({ inviteId });
    logMatchesAction("acceptPlayInvite rpc", tRpc, result.updated ? 1 : 0);
    const actionResult = mapUpdatePlayInviteActionResult(result);

    if (actionResult.status !== "success") {
      logMatchesAction("acceptPlayInvite total", tAction, 0);
      return actionResult;
    }

    const tRevalidate = stacksPerfStart();
    revalidatePath("/matches");
    logMatchesAction("acceptPlayInvite revalidate", tRevalidate);
    logMatchesAction("acceptPlayInvite total", tAction, 1);

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
  const tAction = stacksPerfStart();
  const tAuth = stacksPerfStart();
  const requiredProfile = await requireCurrentProfile();
  logMatchesAction("declinePlayInvite auth+profile", tAuth, requiredProfile.profile ? 1 : 0);

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
    const tExpire = stacksPerfStart();
    const expireResult = await expirePlayInvitesRecord({ inviteId });
    logMatchesAction("declinePlayInvite expire sweep", tExpire, expireResult.expiredCount);

    if (expireResult.errorCode === "unauthenticated") {
      return { status: "unauthenticated" };
    }

    const tRpc = stacksPerfStart();
    const result = await declinePlayInviteRecord({ inviteId });
    logMatchesAction("declinePlayInvite rpc", tRpc, result.updated ? 1 : 0);
    const actionResult = mapUpdatePlayInviteActionResult(result);

    if (actionResult.status !== "success") {
      logMatchesAction("declinePlayInvite total", tAction, 0);
      return actionResult;
    }

    const tRevalidate = stacksPerfStart();
    revalidatePath("/matches");
    logMatchesAction("declinePlayInvite revalidate", tRevalidate);
    logMatchesAction("declinePlayInvite total", tAction, 1);

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
  const tAction = stacksPerfStart();
  const tAuth = stacksPerfStart();
  const requiredProfile = await requireCurrentProfile();
  logMatchesAction("cancelPlayInvite auth+profile", tAuth, requiredProfile.profile ? 1 : 0);

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
    const tExpire = stacksPerfStart();
    const expireResult = await expirePlayInvitesRecord({ inviteId });
    logMatchesAction("cancelPlayInvite expire sweep", tExpire, expireResult.expiredCount);

    if (expireResult.errorCode === "unauthenticated") {
      return { status: "unauthenticated" };
    }

    const tRpc = stacksPerfStart();
    const result = await cancelPlayInviteRecord({ inviteId });
    logMatchesAction("cancelPlayInvite rpc", tRpc, result.updated ? 1 : 0);
    const actionResult = mapUpdatePlayInviteActionResult(result);

    if (actionResult.status !== "success") {
      logMatchesAction("cancelPlayInvite total", tAction, 0);
      return actionResult;
    }

    const tRevalidate = stacksPerfStart();
    revalidatePath("/matches");
    logMatchesAction("cancelPlayInvite revalidate", tRevalidate);
    logMatchesAction("cancelPlayInvite total", tAction, 1);

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
  const tAction = stacksPerfStart();
  const tAuth = stacksPerfStart();
  const requiredProfile = await requireCurrentProfile();
  logMatchesAction("expirePlayInvites auth+profile", tAuth, requiredProfile.profile ? 1 : 0);

  if (requiredProfile.result) {
    return requiredProfile.result;
  }

  const profile = requiredProfile.profile;

  if (!profile) {
    return { status: "onboarding_required" };
  }

  try {
    const tRpc = stacksPerfStart();
    const result = await expirePlayInvitesRecord({
      inviteId: optionalTrimmedString(input?.inviteId),
    });
    logMatchesAction("expirePlayInvites rpc", tRpc, result.expiredCount);

    const actionResult = mapExpirePlayInvitesActionResult(result);

    if (actionResult.status !== "success") {
      logMatchesAction("expirePlayInvites total", tAction, 0);
      return actionResult;
    }

    const tRevalidate = stacksPerfStart();
    revalidatePath("/matches");
    logMatchesAction("expirePlayInvites revalidate", tRevalidate);
    logMatchesAction("expirePlayInvites total", tAction, actionResult.expiredCount);

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

export async function removeProfileConnection(input: {
  connectionId: string;
}): Promise<RemoveProfileConnectionActionResult> {
  const tAction = stacksPerfStart();
  const tAuth = stacksPerfStart();
  const requiredProfile = await requireCurrentProfile();
  logMatchesAction("removeProfileConnection auth+profile", tAuth, requiredProfile.profile ? 1 : 0);

  if (requiredProfile.result) {
    return requiredProfile.result;
  }

  const profile = requiredProfile.profile;

  if (!profile) {
    return { status: "onboarding_required" };
  }

  const connectionId = optionalTrimmedString(input.connectionId);

  if (!connectionId) {
    return { status: "error", message: "Choose a connection to remove." };
  }

  try {
    const tRpc = stacksPerfStart();
    const result = await removeProfileConnectionRecord({ connectionId });
    logMatchesAction("removeProfileConnection rpc", tRpc, result.updated ? 1 : 0);
    const actionResult = mapRemoveProfileConnectionActionResult(result);

    if (actionResult.status !== "success") {
      logMatchesAction("removeProfileConnection total", tAction, 0);
      return actionResult;
    }

    const tRevalidate = stacksPerfStart();
    revalidatePath("/matches");
    logMatchesAction("removeProfileConnection revalidate", tRevalidate);
    logMatchesAction("removeProfileConnection total", tAction, 1);

    return actionResult;
  } catch (error) {
    console.error("Profile connection removal failed", {
      connectionId,
      error,
      profileId: profile.id,
    });

    return {
      status: "error",
      message: "Unable to remove that connection right now.",
    };
  }
}
