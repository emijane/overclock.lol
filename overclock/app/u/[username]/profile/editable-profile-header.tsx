"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { blockUser, unblockUser } from "@/features/blocks/actions";
import { UserBlockMenu } from "@/components/blocks/user-block-controls";
import { ProfileHeader } from "./profile-header";
import { InviteToPlayButton } from "./invite-to-play-button";
import type {
  InviteViewerState,
  ProfileInviteState,
} from "@/lib/matches/play-invite-types";

type EditableProfileHeaderProps = React.ComponentProps<typeof ProfileHeader> & {
  activeConnectionId?: string | null;
  currentViewerProfileId?: string | null;
  initiallyBlockedByViewer?: boolean;
  pendingOutgoingInviteId?: string | null;
  profileActionState?: ProfileInviteState;
  viewerState?: InviteViewerState;
};

export function EditableProfileHeader({
  activeConnectionId,
  currentViewerProfileId,
  initiallyBlockedByViewer = false,
  pendingOutgoingInviteId,
  ...props
}: EditableProfileHeaderProps) {
  const router = useRouter();
  const [blockedByViewer, setBlockedByViewer] = useState(initiallyBlockedByViewer);
  const [isBlockPending, startBlockTransition] = useTransition();

  function handleBlockedChange(nextBlocked: boolean) {
    startBlockTransition(async () => {
      const result = nextBlocked
        ? await blockUser(props.id)
        : await unblockUser(props.id);

      if (result.ok) {
        setBlockedByViewer(nextBlocked);
      }

      router.refresh();
    });
  }

  return (
    <ProfileHeader
      {...props}
      onEditProfile={props.isOwner ? () => router.push("/account") : undefined}
      profileAction={
        !props.isOwner && props.profileActionState && props.viewerState ? (
          <div className="flex items-center gap-1.5">
            <InviteToPlayButton
              activeConnectionId={activeConnectionId ?? null}
              blockedByViewer={blockedByViewer}
              externalPending={isBlockPending}
              initialInviteId={pendingOutgoingInviteId ?? null}
              initialState={props.profileActionState}
              onUnblock={() => handleBlockedChange(false)}
              recipientProfileId={props.id}
              viewerState={props.viewerState}
            />
            {currentViewerProfileId ? (
              <UserBlockMenu
                blocked={blockedByViewer}
                isPending={isBlockPending}
                onBlockedChange={handleBlockedChange}
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
