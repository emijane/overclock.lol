"use server";

import {
  getAuthenticatedProfileContextOrNull,
  revalidateAccountProfile,
} from "./shared";

export type SetLookingToPlayResult =
  | { status: "success"; isLookingToPlay: boolean }
  | { status: "unauthenticated" }
  | { status: "error"; message: string };

export type SetHideOfflinePresenceResult =
  | { status: "success"; hideOfflinePresence: boolean }
  | { status: "unauthenticated" }
  | { status: "error"; message: string };

async function updateProfileBooleanPreference(input: {
  column: "hide_offline_presence" | "is_looking_to_play";
  errorLogLabel: string;
  errorMessage: string;
  value: boolean;
}) {
  const context = await getAuthenticatedProfileContextOrNull();

  if (!context) {
    return { status: "unauthenticated" } as const;
  }

  const { error } = await context.supabase
    .from("profiles")
    .update({
      [input.column]: input.value,
    })
    .eq("id", context.userId);

  if (error) {
    console.error(`${input.errorLogLabel} failed`, {
      error,
      profileId: context.userId,
      value: input.value,
    });
    return {
      status: "error",
      message: input.errorMessage,
    } as const;
  }

  revalidateAccountProfile(context.username);
  return { status: "success" } as const;
}

export async function setLookingToPlay(
  isLookingToPlay: boolean
): Promise<SetLookingToPlayResult> {
  const result = await updateProfileBooleanPreference({
    column: "is_looking_to_play",
    errorLogLabel: "Looking to play toggle",
    errorMessage: "Unable to update availability right now.",
    value: isLookingToPlay,
  });

  if (result.status !== "success") {
    return result;
  }

  return { status: "success", isLookingToPlay };
}

export async function setHideOfflinePresence(
  hideOfflinePresence: boolean
): Promise<SetHideOfflinePresenceResult> {
  const result = await updateProfileBooleanPreference({
    column: "hide_offline_presence",
    errorLogLabel: "Hide offline presence toggle",
    errorMessage: "Unable to update presence privacy right now.",
    value: hideOfflinePresence,
  });

  if (result.status !== "success") {
    return result;
  }

  return { status: "success", hideOfflinePresence };
}
