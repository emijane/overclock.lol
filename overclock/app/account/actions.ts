"use server";

export {
  setHideOfflinePresence,
  setLookingToPlay,
  updateLastSeen,
  updateProfile,
  uploadProfileAvatar,
  uploadProfileCover,
} from "@/features/profile/actions";

export type {
  SetHideOfflinePresenceResult,
  SetLookingToPlayResult,
} from "@/features/profile/actions";
