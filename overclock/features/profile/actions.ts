"use server";

export { updateLastSeen, updateProfile } from "./actions/profile-basics";
export { uploadProfileAvatar, uploadProfileCover } from "./actions/profile-media";
export {
  setHideOfflinePresence,
  setLookingToPlay,
} from "./actions/profile-privacy";

export type {
  SetHideOfflinePresenceResult,
  SetLookingToPlayResult,
} from "./actions/profile-privacy";
