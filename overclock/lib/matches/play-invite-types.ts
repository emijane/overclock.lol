export type ProfileInviteState =
  | "invite_to_play"
  | "invite_sent"
  | "connected";

export type LFGInviteStateMap = Record<string, ProfileInviteState>;

export type InviteViewerState = "guest" | "profile_required" | "signed_in";
