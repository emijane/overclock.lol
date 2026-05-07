"use client";

import { useRouter } from "next/navigation";

import { ProfileHeader } from "./profile-header";
import { InviteToPlayButton } from "./invite-to-play-button";
import type {
  InviteViewerState,
  ProfileInviteState,
} from "@/lib/matches/play-invite-types";

type EditableProfileHeaderProps = React.ComponentProps<typeof ProfileHeader> & {
  activeConnectionId?: string | null;
  pendingOutgoingInviteId?: string | null;
  profileActionState?: ProfileInviteState;
  viewerState?: InviteViewerState;
};

export function EditableProfileHeader({
  activeConnectionId,
  pendingOutgoingInviteId,
  ...props
}: EditableProfileHeaderProps) {
  const router = useRouter();

  return (
    <ProfileHeader
      {...props}
      onEditProfile={props.isOwner ? () => router.push("/account") : undefined}
      profileAction={
        !props.isOwner && props.profileActionState && props.viewerState ? (
          <InviteToPlayButton
            activeConnectionId={activeConnectionId ?? null}
            initialInviteId={pendingOutgoingInviteId ?? null}
            initialState={props.profileActionState}
            recipientProfileId={props.id}
            viewerState={props.viewerState}
          />
        ) : null
      }
    />
  );
}
