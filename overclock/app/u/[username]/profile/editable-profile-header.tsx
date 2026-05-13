"use client";

import { useRouter } from "next/navigation";

import { UserBlockMenu } from "@/features/blocks/components/user-block-controls";
import { ProfileHeader } from "./profile-header";
import { InviteToPlayButton } from "./invite-to-play-button";
import type {
  InviteViewerState,
  ProfileInviteState,
} from "@/lib/matches/play-invite-types";

type EditableProfileHeaderProps = React.ComponentProps<typeof ProfileHeader> & {
  activeConnectionId?: string | null;
  currentViewerProfileId?: string | null;
  pendingOutgoingInviteId?: string | null;
  profileActionState?: ProfileInviteState;
  viewerState?: InviteViewerState;
};

export function EditableProfileHeader({
  activeConnectionId,
  currentViewerProfileId,
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
          <div className="flex items-center gap-1.5">
            <InviteToPlayButton
              activeConnectionId={activeConnectionId ?? null}
              initialInviteId={pendingOutgoingInviteId ?? null}
              initialState={props.profileActionState}
              recipientProfileId={props.id}
              viewerState={props.viewerState}
            />
            {currentViewerProfileId ? (
              <UserBlockMenu
                targetDisplayName={props.displayName}
                targetProfileId={props.id}
                targetUsername={props.username}
                triggerClassName="oc-profile-icon-button inline-flex h-8 w-8 items-center justify-center text-zinc-300 transition hover:text-zinc-100"
                triggerLabel="Profile actions"
              />
            ) : null}
          </div>
        ) : null
      }
    />
  );
}
