import type {
  InviteViewerState,
  ProfileInviteState,
} from "@/lib/matches/play-invite-types";

type InviteActionPresentation = {
  canSendInvite: boolean;
  href: string | null;
  label: string;
};

type InviteActionPresentationInput = {
  inviteState: ProfileInviteState;
  isPending: boolean;
  labels?: Partial<{
    idle: string;
    matched: string;
    pending: string;
    sending: string;
  }>;
  viewerState: InviteViewerState;
};

const DEFAULT_LABELS = {
  idle: "Invite to Play",
  matched: "Matched",
  pending: "Invite Sent",
  sending: "Sending...",
} as const;

export function getInviteActionPresentation(
  input: InviteActionPresentationInput
): InviteActionPresentation {
  if (input.viewerState === "guest") {
    return {
      canSendInvite: false,
      href: "/login?type=error&message=Sign%20in%20to%20send%20play%20invites.",
      label: "Sign in to invite",
    };
  }

  if (input.viewerState === "profile_required") {
    return {
      canSendInvite: false,
      href: "/onboarding",
      label: "Profile Required",
    };
  }

  const labels = {
    ...DEFAULT_LABELS,
    ...input.labels,
  };

  if (input.isPending) {
    return {
      canSendInvite: false,
      href: null,
      label: labels.sending,
    };
  }

  if (input.inviteState === "invite_sent") {
    return {
      canSendInvite: false,
      href: null,
      label: labels.pending,
    };
  }

  if (input.inviteState === "matched") {
    return {
      canSendInvite: false,
      href: null,
      label: labels.matched,
    };
  }

  return {
    canSendInvite: true,
    href: null,
    label: labels.idle,
  };
}
