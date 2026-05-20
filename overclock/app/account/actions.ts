"use server";

export { updateLastSeen, updateProfile } from "@/features/profile/actions/profile-basics";
export {
  uploadProfileAvatar,
  uploadProfileCover,
} from "@/features/profile/actions/profile-media";
export {
  setHideOfflinePresence,
  setLookingToPlay,
} from "@/features/profile/actions/profile-privacy";

export type {
  SetHideOfflinePresenceResult,
  SetLookingToPlayResult,
} from "@/features/profile/actions/profile-privacy";
