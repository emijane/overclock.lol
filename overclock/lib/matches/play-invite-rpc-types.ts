export type PlayInviteStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "cancelled";

export type RemoveProfileConnectionResult = {
  connectionId: string | null;
  errorCode: string | null;
  updated: boolean;
};

export type SendPlayInviteResult = {
  created: boolean;
  errorCode: string | null;
  inviteId: string | null;
};

export type UpdatePlayInviteResult = {
  errorCode: string | null;
  inviteId: string | null;
  status: PlayInviteStatus | null;
  updated: boolean;
};

export type ExpirePlayInvitesResult = {
  errorCode: string | null;
  expiredCount: number;
};
