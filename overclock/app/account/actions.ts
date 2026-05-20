"use server";

import {
  updateLastSeen as updateLastSeenAction,
  updateProfile as updateProfileAction,
} from "@/features/profile/actions/profile-basics";
import {
  uploadProfileAvatar as uploadProfileAvatarAction,
  uploadProfileCover as uploadProfileCoverAction,
  type UploadMediaResult,
} from "@/features/profile/actions/profile-media";
import {
  setHideOfflinePresence as setHideOfflinePresenceAction,
  setLookingToPlay as setLookingToPlayAction,
} from "@/features/profile/actions/profile-privacy";

export type {
  SetHideOfflinePresenceResult,
  SetLookingToPlayResult,
} from "@/features/profile/actions/profile-privacy";

export async function updateLastSeen() {
  return updateLastSeenAction();
}

export async function updateProfile(formData: FormData) {
  return updateProfileAction(formData);
}

export async function uploadProfileAvatar(
  formData: FormData
): Promise<UploadMediaResult> {
  return uploadProfileAvatarAction(formData);
}

export async function uploadProfileCover(
  formData: FormData
): Promise<UploadMediaResult> {
  return uploadProfileCoverAction(formData);
}

export async function setHideOfflinePresence(hideOfflinePresence: boolean) {
  return setHideOfflinePresenceAction(hideOfflinePresence);
}

export async function setLookingToPlay(isLookingToPlay: boolean) {
  return setLookingToPlayAction(isLookingToPlay);
}
