"use client";

import { useState } from "react";

import { ProfileHeader } from "./profile-header";
import { ProfileEditModalShell } from "./profile-edit-modal-shell";

type EditableProfileHeaderProps = React.ComponentProps<typeof ProfileHeader>;

export function EditableProfileHeader(props: EditableProfileHeaderProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <ProfileHeader
        {...props}
        onEditProfile={props.isOwner ? () => setIsEditModalOpen(true) : undefined}
      />
      <ProfileEditModalShell
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
}
